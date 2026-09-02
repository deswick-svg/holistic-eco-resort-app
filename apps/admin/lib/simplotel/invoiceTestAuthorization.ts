import { createHash, timingSafeEqual } from "node:crypto";

export class InvoiceTestAuthorizationError extends Error {
  constructor() {
    super("Controlled invoice test authorization is required.");
  }
}

// Operator-only credential. Never accept this from the JSON payload or return it.
export function requireInvoiceTestAuthorization(
  headers: Headers,
  expected = process.env.SIMPLOTEL_INVOICE_TEST_SECRET
) {
  const supplied = headers.get("X-Simplotel-Test-Authorization");
  if (!expected || expected.length < 32 || expected.trim() !== expected || !supplied) {
    throw new InvoiceTestAuthorizationError();
  }
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(supplied), digest(expected))) {
    throw new InvoiceTestAuthorizationError();
  }
}
