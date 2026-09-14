import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const db = { update: vi.fn(() => ({ set: updateSet })) };
  return {
    getWorkspace: vi.fn(),
    saveQuote: vi.fn().mockResolvedValue({ id: 20, quoteNumber: "QT-TEST-001" }),
    createNotification: vi.fn().mockResolvedValue({ id: 30 }),
    logActivity: vi.fn().mockResolvedValue(undefined),
    getDb: vi.fn().mockResolvedValue(db),
    db,
  };
});

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getRfqWorkspace: mocks.getWorkspace, saveQuote: mocks.saveQuote, createNotification: mocks.createNotification, logActivity: mocks.logActivity, getDb: mocks.getDb };
});
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn().mockResolvedValue(undefined) }));

import { appRouter } from "./routers";

const context = {
  user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { headers: {} },
  res: {},
} as never;

const input = {
  rfqNumber: "RFQ-TEST-001",
  quoteNumber: "QT-TEST-001",
  discount: 0,
  taxRate: 0,
  shipping: 0,
  currency: "USD",
  items: [{ description: "Test item", quantity: 2, unitPrice: 100 }],
};

const workspace = { rfq: { id: 9, rfqNumber: "RFQ-TEST-001", assignedUserId: 1 }, requirements: [], clarifications: [], quote: { id: 20, quoteNumber: "QT-TEST-001" } } as never;

describe("quote mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDb.mockResolvedValue(mocks.db);
  });

  it("returns NOT_FOUND when saving against a missing RFQ", async () => {
    mocks.getWorkspace.mockResolvedValueOnce(undefined);
    await expect(appRouter.createCaller(context).rfq.quote.save(input)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("saves a quote when the RFQ workspace exists", async () => {
    mocks.getWorkspace.mockResolvedValueOnce(workspace);
    const result = await appRouter.createCaller(context).rfq.quote.save(input);
    expect(result.quote).toEqual({ id: 20, quoteNumber: "QT-TEST-001" });
    expect(mocks.saveQuote).toHaveBeenCalledWith(expect.objectContaining({ rfqId: 9, quoteNumber: "QT-TEST-001" }), expect.any(Array));
  });

  it("returns NOT_FOUND when releasing a missing quote draft", async () => {
    mocks.getWorkspace.mockResolvedValueOnce(undefined);
    await expect(appRouter.createCaller(context).rfq.quote.release({ rfqNumber: input.rfqNumber, quoteNumber: input.quoteNumber })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("blocks release while requirements are missing", async () => {
    mocks.getWorkspace.mockResolvedValueOnce({ ...workspace, requirements: [{ status: "missing" }], clarifications: [] });
    await expect(appRouter.createCaller(context).rfq.quote.release({ rfqNumber: input.rfqNumber, quoteNumber: input.quoteNumber })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("releases an existing quote after readiness checks pass", async () => {
    mocks.getWorkspace.mockResolvedValueOnce(workspace);
    const result = await appRouter.createCaller(context).rfq.quote.release({ rfqNumber: input.rfqNumber, quoteNumber: input.quoteNumber });
    expect(result).toEqual({ success: true, status: "ready" });
    expect(mocks.db.update).toHaveBeenCalledTimes(2);
  });
});
