export type QuoteLine = { quantity: number; unitPrice: number };
export type Requirement = { label: string; status: "approved" | "missing" | "exception"; note?: string };
export type ClarificationStatus = "draft" | "sent" | "resolved" | "cancelled";

export function calculateQuote(lines: QuoteLine[], discount = 0, taxRate = 0, shipping = 0) {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discountAmount = subtotal * (discount / 100);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * (taxRate / 100);
  const grandTotal = taxable + taxAmount + shipping;
  return { subtotal, discountAmount, taxAmount, shipping, grandTotal };
}

export function requirementsReady(requirements: Requirement[]) {
  return requirements.length > 0 && requirements.every((requirement) => requirement.status === "approved" || requirement.status === "exception");
}

export function clarificationCanRelease(status: ClarificationStatus) {
  return status === "resolved" || status === "cancelled";
}
