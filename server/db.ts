import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, companies, customers, rfqs, rfqDocuments, rfqItems, rfqRequirements, clarifications, quotes, quoteItems, notifications, activity } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { deadlineAlertKind } from "../shared/notifications";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }
export async function getDeadlineScheduleTaskUid(userId: number) { const db = await getDb(); if (!db) return undefined; const result = await db.select({ taskUid: users.deadlineScheduleTaskUid }).from(users).where(eq(users.id, userId)).limit(1); return result[0]?.taskUid ?? null; }
export async function setDeadlineScheduleTaskUid(userId: number, taskUid: string | null) { const db = await getDb(); if (!db) return; await db.update(users).set({ deadlineScheduleTaskUid: taskUid }).where(eq(users.id, userId)); }

export async function listRfqs(userId?: number, role?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select({ rfq: rfqs, customer: customers, company: companies }).from(rfqs).leftJoin(customers, eq(rfqs.customerId, customers.id)).leftJoin(companies, eq(customers.companyId, companies.id));
  if (role !== "admin" && userId) return query.where(eq(rfqs.assignedUserId, userId)).orderBy(desc(rfqs.receivedAt));
  return query.orderBy(desc(rfqs.receivedAt));
}
export async function getRfqWorkspace(rfqNumber: string, userId?: number, role?: string) {
  const db = await getDb();
  if (!db) return undefined;
  const query = db.select({ rfq: rfqs, customer: customers, company: companies }).from(rfqs).leftJoin(customers, eq(rfqs.customerId, customers.id)).leftJoin(companies, eq(customers.companyId, companies.id));
  const filteredQuery = role !== "admin" && userId
    ? query.where(and(eq(rfqs.rfqNumber, rfqNumber), eq(rfqs.assignedUserId, userId)))
    : query.where(eq(rfqs.rfqNumber, rfqNumber));
  const rfq = (await filteredQuery.limit(1))[0];
  if (!rfq) return undefined;
  const [items, requirements, docs, openClarifications, quote, events] = await Promise.all([
    db.select().from(rfqItems).where(eq(rfqItems.rfqId, rfq.rfq.id)),
    db.select().from(rfqRequirements).where(eq(rfqRequirements.rfqId, rfq.rfq.id)),
    db.select().from(rfqDocuments).where(eq(rfqDocuments.rfqId, rfq.rfq.id)),
    db.select().from(clarifications).where(and(eq(clarifications.rfqId, rfq.rfq.id), isNull(clarifications.resolvedAt))),
    db.select().from(quotes).where(eq(quotes.rfqId, rfq.rfq.id)).orderBy(desc(quotes.updatedAt)).limit(1),
    db.select().from(activity).where(eq(activity.rfqId, rfq.rfq.id)).orderBy(desc(activity.createdAt)).limit(50),
  ]);
  return { ...rfq, items, requirements, documents: docs, clarifications: openClarifications, quote: quote[0], activity: events };
}
export async function createRfqRecord(input: { rfqNumber: string; title: string; companyName: string; contactName?: string; email?: string; estimatedValue?: string; assignedUserId?: number }) {
  const db = await getDb();
  if (!db) return undefined;
  const company = (await db.insert(companies).values({ name: input.companyName }).$returningId())[0];
  const customer = (await db.insert(customers).values({ companyId: company.id, contactName: input.contactName, email: input.email }).$returningId())[0];
  const rfq = (await db.insert(rfqs).values({ rfqNumber: input.rfqNumber, title: input.title, customerId: customer.id, estimatedValue: input.estimatedValue, assignedUserId: input.assignedUserId }).$returningId())[0];
  await db.insert(activity).values({ rfqId: rfq.id, action: "RFQ created", metadata: { source: "inbox" } });
  return { rfqId: rfq.id, rfqNumber: input.rfqNumber };
}
export async function addRfqDocument(input: typeof rfqDocuments.$inferInsert) { const db = await getDb(); if (!db) return undefined; return (await db.insert(rfqDocuments).values(input).$returningId())[0]; }
export async function addRfqItems(rfqId: number, items: Array<typeof rfqItems.$inferInsert>) { const db = await getDb(); if (!db || !items.length) return []; return db.insert(rfqItems).values(items.map(item => ({ ...item, rfqId }))); }
export async function addRequirements(rfqId: number, requirements: Array<typeof rfqRequirements.$inferInsert>) { const db = await getDb(); if (!db || !requirements.length) return []; return db.insert(rfqRequirements).values(requirements.map(item => ({ ...item, rfqId }))); }
export async function createClarification(input: typeof clarifications.$inferInsert) { const db = await getDb(); if (!db) return undefined; return (await db.insert(clarifications).values(input).$returningId())[0]; }
export async function updateClarification(id: number, patch: Partial<typeof clarifications.$inferInsert>) { const db = await getDb(); if (!db) return; await db.update(clarifications).set(patch).where(eq(clarifications.id, id)); }
export async function saveQuote(input: typeof quotes.$inferInsert, items: Array<typeof quoteItems.$inferInsert>) { const db = await getDb(); if (!db) return undefined; const quote = (await db.insert(quotes).values(input).$returningId())[0]; if (items.length) await db.insert(quoteItems).values(items.map(item => ({ ...item, quoteId: quote.id }))); return quote; }
export async function createNotification(input: typeof notifications.$inferInsert) { const db = await getDb(); if (!db) return undefined; return (await db.insert(notifications).values(input).$returningId())[0]; }
export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const assignedRfqs = await db.select().from(rfqs).where(eq(rfqs.assignedUserId, userId));
  for (const rfq of assignedRfqs) {
    const missing = await db.select().from(rfqRequirements).where(and(eq(rfqRequirements.rfqId, rfq.id), eq(rfqRequirements.status, "missing")));
    if (missing.length > 0) {
      const existing = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.rfqId, rfq.id), eq(notifications.type, "missing_information"), isNull(notifications.readAt))).limit(1);
      if (!existing.length) await db.insert(notifications).values({ userId, rfqId: rfq.id, type: "missing_information", title: "Information required", body: `${rfq.rfqNumber} has ${missing.length} missing requirement${missing.length === 1 ? "" : "s"} before quote release.` });
    }
    const alertKind = deadlineAlertKind(rfq.deadline, now);
    if (alertKind === "deadline") {
      const existing = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.rfqId, rfq.id), eq(notifications.type, "deadline"), isNull(notifications.readAt))).limit(1);
      if (!existing.length) await db.insert(notifications).values({ userId, rfqId: rfq.id, type: "deadline", title: "RFQ deadline approaching", body: `${rfq.rfqNumber} is due within 48 hours.` });
    }
    if (alertKind === "overdue" && !["QUOTED", "WON", "LOST"].includes(rfq.status)) {
      const existing = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.rfqId, rfq.id), eq(notifications.type, "overdue"), isNull(notifications.readAt))).limit(1);
      if (!existing.length) await db.insert(notifications).values({ userId, rfqId: rfq.id, type: "overdue", title: "RFQ is overdue", body: `${rfq.rfqNumber} has passed its requested deadline.` });
    }
  }
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}
export async function materializeDeadlineNotifications() {
  const db = await getDb();
  if (!db) return 0;
  const owners = await db.select({ userId: rfqs.assignedUserId }).from(rfqs).where(isNotNull(rfqs.assignedUserId));
  const uniqueOwners = Array.from(new Set(owners.map((row) => row.userId).filter((id): id is number => typeof id === "number")));
  for (const userId of uniqueOwners) await listNotifications(userId);
  return uniqueOwners.length;
}
export async function markNotificationRead(id: number, userId: number) { const db = await getDb(); if (!db) return; await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId))); }
export async function logActivity(input: typeof activity.$inferInsert) { const db = await getDb(); if (!db) return; await db.insert(activity).values(input); }
