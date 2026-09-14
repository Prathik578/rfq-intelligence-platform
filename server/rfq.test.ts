import { describe, expect, it } from "vitest";
import { calculateQuote, clarificationCanRelease, requirementsReady, transitionClarification } from "../shared/rfq";
import { deadlineAlertKind, resolveNotificationRecipient } from "../shared/notifications";

describe("RFQ business rules", () => {
  it("calculates subtotal, discount, tax, shipping, and grand total", () => {
    expect(calculateQuote([{ quantity: 2, unitPrice: 100 }, { quantity: 1, unitPrice: 50 }], 10, 18, 25)).toEqual({ subtotal: 250, discountAmount: 25, taxAmount: 40.5, shipping: 25, grandTotal: 290.5 });
  });
  it("requires all requirements to be approved or explicitly excepted", () => {
    expect(requirementsReady([{ label: "Customer", status: "approved" }, { label: "Material", status: "exception" }])).toBe(true);
    expect(requirementsReady([{ label: "Customer", status: "approved" }, { label: "Material", status: "missing" }])).toBe(false);
  });
  it("only permits release after a clarification is resolved or cancelled", () => {
    expect(clarificationCanRelease("draft")).toBe(false);
    expect(clarificationCanRelease("sent")).toBe(false);
    expect(clarificationCanRelease("resolved")).toBe(true);
    expect(clarificationCanRelease("cancelled")).toBe(true);
  });
  it("routes missing-information and quote-milestone alerts to the owner when assigned", () => {
    expect(resolveNotificationRecipient(42, 7)).toBe(42);
    expect(resolveNotificationRecipient(null, 7)).toBe(7);
    expect(deadlineAlertKind(new Date("2026-09-12T12:00:00Z"), new Date("2026-09-12T10:00:00Z"))).toBe("deadline");
    expect(deadlineAlertKind(new Date("2026-09-12T09:00:00Z"), new Date("2026-09-12T10:00:00Z"))).toBe("overdue");
    expect(deadlineAlertKind(new Date("2026-09-16T10:00:00Z"), new Date("2026-09-12T10:00:00Z"))).toBe(null);
  });
  it("models clarification create/update transitions", () => {
    expect(transitionClarification("draft", "save")).toBe("draft");
    expect(transitionClarification("draft", "send")).toBe("sent");
    expect(transitionClarification("sent", "resolve")).toBe("resolved");
    expect(transitionClarification("sent", "cancel")).toBe("cancelled");
    expect(transitionClarification("draft", "resolve")).toBe("draft");
    expect(transitionClarification("resolved", "send")).toBe("resolved");
  });
});
