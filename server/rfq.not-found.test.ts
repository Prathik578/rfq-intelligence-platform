import { describe, expect, it, vi } from "vitest";

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getRfqWorkspace: vi.fn().mockResolvedValue(undefined) };
});

import { appRouter } from "./routers";

const context = {
  user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { headers: {} },
  res: {},
} as never;

describe("rfq.get missing workspace", () => {
  it("returns null so the query never resolves with undefined", async () => {
    const result = await appRouter.createCaller(context).rfq.get({ rfqNumber: "RFQ-MISSING" });
    expect(result).toBeNull();
  });
});
