import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { createHeartbeatJob, deleteHeartbeatJob } from "./_core/heartbeat";
import { storagePut } from "./storage";
import { addRequirements, addRfqDocument, addRfqItems, createClarification, createNotification, createRfqRecord, getDeadlineScheduleTaskUid, getRfqWorkspace, getUserByOpenId, listNotifications, listRfqs, logActivity, markNotificationRead, saveQuote, setDeadlineScheduleTaskUid, updateClarification } from "./db";
import { calculateQuote, transitionClarification } from "../shared/rfq";
import { resolveNotificationRecipient } from "../shared/notifications";

const extractionSchema = {
  type: "object",
  properties: {
    customer: { type: "object", properties: { companyName: { type: "string" }, contactName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, address: { type: "string" } }, required: ["companyName", "contactName", "email", "phone", "address"], additionalProperties: false },
    rfq: { type: "object", properties: { rfqNumber: { type: "string" }, rfqDate: { type: "string" }, deadline: { type: "string" }, currency: { type: "string" }, deliveryLocation: { type: "string" }, paymentTerms: { type: "string" }, incoterms: { type: "string" } }, required: ["rfqNumber", "rfqDate", "deadline", "currency", "deliveryLocation", "paymentTerms", "incoterms"], additionalProperties: false },
    items: { type: "array", items: { type: "object", properties: { productName: { type: "string" }, sku: { type: "string" }, description: { type: "string" }, quantity: { type: "number" }, unit: { type: "string" }, dimensions: { type: "string" }, material: { type: "string" }, grade: { type: "string" }, specifications: { type: "string" }, certifications: { type: "string" }, deliveryRequirements: { type: "string" }, specialRequirements: { type: "string" }, confidence: { type: "number" } }, required: ["productName", "sku", "description", "quantity", "unit", "dimensions", "material", "grade", "specifications", "certifications", "deliveryRequirements", "specialRequirements", "confidence"], additionalProperties: false } },
    missingInformation: { type: "array", items: { type: "string" } },
  },
  required: ["customer", "rfq", "items", "missingInformation"],
  additionalProperties: false,
} as const;

const statusSchema = z.enum(["NEW", "PROCESSING", "REVIEW_REQUIRED", "WAITING_FOR_INFORMATION", "READY_FOR_QUOTE", "QUOTED", "WON", "LOST"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  rfq: router({
    list: protectedProcedure.query(({ ctx }) => listRfqs(ctx.user.id, ctx.user.role)),
    get: protectedProcedure.input(z.object({ rfqNumber: z.string() })).query(async ({ ctx, input }) => (await getRfqWorkspace(input.rfqNumber, ctx.user.id, ctx.user.role)) ?? null),
    create: protectedProcedure.input(z.object({ title: z.string().min(2), companyName: z.string().min(2), contactName: z.string().optional(), email: z.string().email().optional(), estimatedValue: z.string().optional(), file: z.object({ name: z.string(), mimeType: z.string(), sizeBytes: z.number(), base64: z.string() }).optional() })).mutation(async ({ ctx, input }) => {
      const rfqNumber = `RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const created = await createRfqRecord({ ...input, rfqNumber, assignedUserId: ctx.user.id });
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      if (input.file) {
        const buffer = Buffer.from(input.file.base64, "base64");
        const stored = await storagePut(`${ctx.user.id}/rfqs/${rfqNumber}/${input.file.name}`, buffer, input.file.mimeType);
        await addRfqDocument({ rfqId: created.rfqId, fileKey: stored.key, fileUrl: stored.url, fileName: input.file.name, mimeType: input.file.mimeType, sizeBytes: input.file.sizeBytes });
      }
      await createNotification({ userId: ctx.user.id, rfqId: created.rfqId, type: "new_rfq", title: "New RFQ received", body: `${rfqNumber} from ${input.companyName} is ready for review.` });
      await logActivity({ rfqId: created.rfqId, actorId: ctx.user.id, action: "RFQ submitted", metadata: { fileName: input.file?.name ?? null } });
      await notifyOwner({ title: "New RFQ received", content: `${rfqNumber} from ${input.companyName} was added to the workspace.` });
      return created;
    }),
    requirement: router({
      update: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["approved", "missing", "exception"]), note: z.string().optional() })).mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { rfqRequirements } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
        await db.update(rfqRequirements).set({ status: input.status, note: input.note }).where(eq(rfqRequirements.id, input.id));
        return { success: true, updatedBy: ctx.user.id } as const;
      }),
    }),
    assignment: protectedProcedure.input(z.object({ rfqNumber: z.string(), assigneeId: z.number(), role: z.enum(["sales", "engineering", "pricing", "manager"]), dueAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
      const workspace = await getRfqWorkspace(input.rfqNumber, ctx.user.id, ctx.user.role);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "RFQ not found" });
      const { getDb } = await import("./db");
      const { assignments } = await import("../drizzle/schema");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      const created = (await db.insert(assignments).values({ rfqId: workspace.rfq.id, assigneeId: input.assigneeId, role: input.role, dueAt: input.dueAt }).$returningId())[0];
      await createNotification({ userId: input.assigneeId, rfqId: workspace.rfq.id, type: "assignment", title: `New ${input.role} assignment`, body: `${input.rfqNumber} has been routed to you.` });
      await logActivity({ rfqId: workspace.rfq.id, actorId: ctx.user.id, action: `RFQ assigned to ${input.role}`, metadata: { assigneeId: input.assigneeId, dueAt: input.dueAt ?? null } });
      return created;
    }),
    note: protectedProcedure.input(z.object({ rfqNumber: z.string(), body: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const workspace = await getRfqWorkspace(input.rfqNumber, ctx.user.id, ctx.user.role);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "RFQ not found" });
      await logActivity({ rfqId: workspace.rfq.id, actorId: ctx.user.id, action: "Internal note added", metadata: { body: input.body } });
      return { success: true } as const;
    }),
    setStatus: protectedProcedure.input(z.object({ rfqNumber: z.string(), status: statusSchema })).mutation(async ({ ctx, input }) => {
      const workspace = await getRfqWorkspace(input.rfqNumber, ctx.user.id, ctx.user.role);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "RFQ not found" });
      const { getDb } = await import("./db"); const { rfqs } = await import("../drizzle/schema"); const { eq } = await import("drizzle-orm"); const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      await db.update(rfqs).set({ status: input.status }).where(eq(rfqs.rfqNumber, input.rfqNumber));
      await logActivity({ rfqId: workspace.rfq.id, actorId: ctx.user.id, action: `Status changed to ${input.status}` });
      return { success: true } as const;
    }),
    uploadDocument: protectedProcedure.input(z.object({ rfqNumber: z.string(), name: z.string(), mimeType: z.string(), sizeBytes: z.number(), base64: z.string(), documentType: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const workspace = await getRfqWorkspace(input.rfqNumber, ctx.user.id, ctx.user.role); if (!workspace) throw new TRPCError({ code: "NOT_FOUND" });
      const stored = await storagePut(`${ctx.user.id}/rfqs/${input.rfqNumber}/${input.name}`, Buffer.from(input.base64, "base64"), input.mimeType);
      const doc = await addRfqDocument({ rfqId: workspace.rfq.id, fileKey: stored.key, fileUrl: stored.url, fileName: input.name, mimeType: input.mimeType, sizeBytes: input.sizeBytes, documentType: input.documentType ?? "supporting" });
      await logActivity({ rfqId: workspace.rfq.id, actorId: ctx.user.id, action: "Document attached", metadata: { fileName: input.name } });
      return { ...doc, url: stored.url };
    }),
    extract: protectedProcedure.input(z.object({ rfqNumber: z.string(), documentUrl: z.string(), mimeType: z.string().default("application/pdf") })).mutation(async ({ ctx, input }) => {
      const workspace = await getRfqWorkspace(input.rfqNumber, ctx.user.id, ctx.user.role); if (!workspace) throw new TRPCError({ code: "NOT_FOUND" });
      const response = await invokeLLM({ messages: [{ role: "system", content: "You are an RFQ extraction engine. Extract only information explicitly present in the uploaded document. Never guess, infer, or fabricate. Use empty strings, zero, or empty arrays for unavailable fields and list missing information explicitly." }, { role: "user", content: [{ type: "text", text: "Extract this RFQ into the requested structured schema. Mark each line item confidence from 0 to 100." }, { type: "file_url", file_url: { url: input.documentUrl, mime_type: input.mimeType === "application/pdf" ? "application/pdf" : "application/pdf" } }] }], response_format: { type: "json_schema", json_schema: { name: "rfq_extraction", strict: true, schema: extractionSchema } } });
      const raw = response.choices?.[0]?.message?.content; if (typeof raw !== "string") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Extraction returned no structured data" });
      const extracted = JSON.parse(raw) as { items: Array<Record<string, unknown>>; missingInformation: string[] };
      await addRfqItems(workspace.rfq.id, extracted.items.map(item => ({ ...item, quantity: String(item.quantity ?? 0), confidence: String(item.confidence ?? 0) })) as never);
      await addRequirements(workspace.rfq.id, ["Customer identified", "Product and quantity identified", "Specifications available", "Delivery location available", "Required delivery date available", "Technical requirements available"].map(label => ({ label, status: extracted.missingInformation.includes(label) ? "missing" : "approved" })) as never);
      if (extracted.missingInformation.length > 0) {
        const recipientId = resolveNotificationRecipient(workspace.rfq.assignedUserId, ctx.user.id);
        await createNotification({ userId: recipientId, rfqId: workspace.rfq.id, type: "missing_information", title: "RFQ needs information", body: `${input.rfqNumber} has ${extracted.missingInformation.length} fields that need clarification before quote release.` });
      }
      await logActivity({ rfqId: workspace.rfq.id, actorId: ctx.user.id, action: "AI extraction completed", metadata: { missingInformation: extracted.missingInformation } });
      return extracted;
    }),
    clarification: router({
      create: protectedProcedure.input(z.object({ rfqNumber: z.string(), subject: z.string(), body: z.string(), assigneeId: z.number().optional() })).mutation(async ({ ctx, input }) => { const workspace = await getRfqWorkspace(input.rfqNumber, ctx.user.id, ctx.user.role); if (!workspace) throw new TRPCError({ code: "NOT_FOUND" }); const created = await createClarification({ rfqId: workspace.rfq.id, subject: input.subject, body: input.body, assigneeId: input.assigneeId ?? ctx.user.id }); await createNotification({ userId: input.assigneeId ?? ctx.user.id, rfqId: workspace.rfq.id, type: "clarification", title: "Clarification draft created", body: input.subject }); return created; }),
      update: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["draft", "sent", "resolved", "cancelled"]), body: z.string().optional() })).mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { clarifications } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
        const current = (await db.select().from(clarifications).where(eq(clarifications.id, input.id)).limit(1))[0];
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Clarification not found" });
        const action = input.status === "sent" ? "send" : input.status === "resolved" ? "resolve" : input.status === "cancelled" ? "cancel" : "save";
        const next = transitionClarification(current.status, action);
        if (next !== input.status) throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot move clarification from ${current.status} to ${input.status}` });
        await updateClarification(input.id, { status: input.status, body: input.body, sentAt: input.status === "sent" ? new Date() : undefined, resolvedAt: input.status === "resolved" ? new Date() : undefined });
        return { success: true, updatedBy: ctx.user.id, status: next } as const;
      }),
    }),
    quote: router({
      save: protectedProcedure.input(z.object({ rfqNumber: z.string(), quoteNumber: z.string(), discount: z.number().default(0), taxRate: z.number().default(0), shipping: z.number().default(0), currency: z.string().default("USD"), leadTime: z.string().optional(), validityDays: z.number().optional(), paymentTerms: z.string().optional(), notes: z.string().optional(), items: z.array(z.object({ rfqItemId: z.number().optional(), description: z.string(), quantity: z.number(), unitPrice: z.number() })) })).mutation(async ({ ctx, input }) => { const workspace = await getRfqWorkspace(input.rfqNumber, ctx.user.id, ctx.user.role); if (!workspace) throw new TRPCError({ code: "NOT_FOUND" }); const totals = calculateQuote(input.items, input.discount, input.taxRate, input.shipping); const quote = await saveQuote({ rfqId: workspace.rfq.id, quoteNumber: input.quoteNumber, status: "draft", currency: input.currency, discount: String(totals.discountAmount), tax: String(totals.taxAmount), shipping: String(totals.shipping), subtotal: String(totals.subtotal), grandTotal: String(totals.grandTotal), leadTime: input.leadTime, validityDays: input.validityDays, paymentTerms: input.paymentTerms, notes: input.notes }, input.items.map(item => ({ ...item, quantity: String(item.quantity), unitPrice: String(item.unitPrice), lineTotal: String(item.quantity * item.unitPrice) })) as never); const recipientId = resolveNotificationRecipient(workspace.rfq.assignedUserId, ctx.user.id); await createNotification({ userId: recipientId, rfqId: workspace.rfq.id, type: "quote_milestone", title: "Quote review milestone", body: `${input.quoteNumber} is saved and ready for the next review step.` }); await logActivity({ rfqId: workspace.rfq.id, actorId: ctx.user.id, action: "Quote draft saved", metadata: { quoteNumber: input.quoteNumber, grandTotal: totals.grandTotal } }); await notifyOwner({ title: "Quote draft updated", content: `${input.quoteNumber} for ${input.rfqNumber} was saved at ${input.currency} ${totals.grandTotal.toFixed(2)}.` }); return { quote, totals }; }),
      release: protectedProcedure.input(z.object({ rfqNumber: z.string(), quoteNumber: z.string() })).mutation(async ({ ctx, input }) => {
        const workspace = await getRfqWorkspace(input.rfqNumber, ctx.user.id, ctx.user.role);
        if (!workspace || !workspace.quote || workspace.quote.quoteNumber !== input.quoteNumber) throw new TRPCError({ code: "NOT_FOUND", message: "Quote draft not found" });
        if (workspace.requirements.some((requirement) => requirement.status === "missing")) throw new TRPCError({ code: "BAD_REQUEST", message: "Resolve all missing requirements before release" });
        if (workspace.clarifications.length > 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Resolve open clarifications before release" });
        const { getDb } = await import("./db");
        const { quotes, rfqs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
        await db.update(quotes).set({ status: "ready" }).where(eq(quotes.id, workspace.quote.id));
        await db.update(rfqs).set({ status: "QUOTED" }).where(eq(rfqs.id, workspace.rfq.id));
        const recipientId = resolveNotificationRecipient(workspace.rfq.assignedUserId, ctx.user.id);
        await createNotification({ userId: recipientId, rfqId: workspace.rfq.id, type: "quote_milestone", title: "Quote ready for release", body: `${input.quoteNumber} passed readiness checks and is ready for customer delivery.` });
        await logActivity({ rfqId: workspace.rfq.id, actorId: ctx.user.id, action: "Quote released", metadata: { quoteNumber: input.quoteNumber } });
        await notifyOwner({ title: "Quote ready for release", content: `${input.quoteNumber} for ${input.rfqNumber} passed the readiness checks.` });
        return { success: true, status: "ready" } as const;
      }),
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => markNotificationRead(input.id, ctx.user.id).then(() => ({ success: true } as const))),
    deadlineScheduleStatus: protectedProcedure.query(async () => { const owner = await getUserByOpenId(ENV.ownerOpenId); return { enabled: Boolean(owner && await getDeadlineScheduleTaskUid(owner.id)) }; }),
    deadlineSchedule: protectedProcedure.input(z.object({ action: z.enum(["enable", "disable"]), cron: z.string().default("0 0 */2 * * *") })).mutation(async ({ ctx, input }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME];
      if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "A signed browser session is required to manage deadline alerts" });
      const owner = await getUserByOpenId(ENV.ownerOpenId);
      if (!owner) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Project owner record is unavailable" });
      const currentTaskUid = await getDeadlineScheduleTaskUid(owner.id);
      if (input.action === "disable") {
        if (currentTaskUid) await deleteHeartbeatJob(currentTaskUid, sessionToken);
        await setDeadlineScheduleTaskUid(owner.id, null);
        return { enabled: false } as const;
      }
      if (currentTaskUid) return { enabled: true, taskUid: currentTaskUid } as const;
      const job = await createHeartbeatJob({ name: `rfq-deadline-alerts-${ctx.user.id}`, cron: input.cron, path: "/api/scheduled/rfq-deadlines", description: "Materialize approaching and overdue RFQ deadline alerts" }, sessionToken);
      await setDeadlineScheduleTaskUid(owner.id, job.taskUid);
      return { enabled: true, taskUid: job.taskUid, nextExecutionAt: job.nextExecutionAt } as const;
    }),
  }),
});
export type AppRouter = typeof appRouter;
