import { createHash, timingSafeEqual } from "node:crypto";
import type { GuestIdentity } from "../guestHistory/model.ts";

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

type ControlledTestEnvironment = {
  SIMPLOTEL_INVOICE_TEST_SECRET?: string;
  SIMPLOTEL_INVOICE_TEST_GUEST_SUB?: string;
  AWS_REGION?: string;
  GUEST_HISTORY_COGNITO_USER_POOL_ID?: string;
};

/**
 * Arms invoice execution for one server-selected Cognito guest. The mobile app
 * supplies only its ordinary access token; it cannot supply the operator secret,
 * select the authorized sub, or override the expected issuer.
 */
export function requireServerControlledInvoiceTestAuthorization(
  identity: GuestIdentity,
  environment: ControlledTestEnvironment = {
    SIMPLOTEL_INVOICE_TEST_SECRET: process.env.SIMPLOTEL_INVOICE_TEST_SECRET,
    SIMPLOTEL_INVOICE_TEST_GUEST_SUB: process.env.SIMPLOTEL_INVOICE_TEST_GUEST_SUB,
    AWS_REGION: process.env.AWS_REGION,
    GUEST_HISTORY_COGNITO_USER_POOL_ID: process.env.GUEST_HISTORY_COGNITO_USER_POOL_ID,
  }
) {
  const secret = environment.SIMPLOTEL_INVOICE_TEST_SECRET;
  const authorizedSub = environment.SIMPLOTEL_INVOICE_TEST_GUEST_SUB;
  const region = environment.AWS_REGION;
  const userPoolId = environment.GUEST_HISTORY_COGNITO_USER_POOL_ID;
  if (
    !secret || secret.length < 32 || secret.trim() !== secret ||
    !authorizedSub || authorizedSub.trim() !== authorizedSub || authorizedSub.length > 200 ||
    !region || !/^[a-z]{2}-[a-z]+-\d$/.test(region) ||
    !userPoolId || !/^[a-z]{2}-[a-z]+-\d_[A-Za-z0-9]+$/.test(userPoolId)
  ) throw new InvoiceTestAuthorizationError();

  const expectedIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const same = (left: string, right: string) => timingSafeEqual(
    createHash("sha256").update(left).digest(),
    createHash("sha256").update(right).digest()
  );
  if (!same(identity.issuer, expectedIssuer) || !same(identity.sub, authorizedSub)) {
    throw new InvoiceTestAuthorizationError();
  }
}
