import { describe, expect, it } from "vitest";
import { calculateQuote, clarificationCanRelease, requirementsReady } from "./rfq";

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
  });
});
