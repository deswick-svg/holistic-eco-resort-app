import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const adminRoot = resolve(process.cwd());
const repositoryRoot = resolve(adminRoot, "..", "..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", ".next", "node_modules"].includes(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

test("mobile source contains no Simplotel token or direct upstream target", () => {
  const mobileRoot = join(repositoryRoot, "apps", "mobile");
  const offenders = sourceFiles(mobileRoot).filter((path) => {
    const source = readFileSync(path, "utf8");
    return (
      source.includes("SIMPLOTEL_ACCESS_TOKEN") ||
      source.includes("admin.simplotel.com") ||
      source.includes("SIMPLOTEL_BOOKING_ENABLED")
      || source.includes("SIMPLOTEL_INVOICE_HOLD_HOURS")
      || source.includes("SIMPLOTEL_INVOICE_HOLD_VALUE")
      || source.includes("SIMPLOTEL_INVOICE_HOLD_UNIT")
      || source.includes("SIMPLOTEL_INVOICE_TEST_SECRET")
      || source.includes("X-Simplotel-Test-Authorization")
    );
  });
  assert.deepEqual(offenders, []);
});

test("direct booking remains isolated behind its own disabled flag", () => {
  const routePath = join(
    adminRoot,
    "app",
    "api",
    "simplotel",
    "booking",
    "route.ts"
  );
  const source = readFileSync(routePath, "utf8");
  const guardIndex = source.indexOf(
    "requireBookingCreationEnabled(isDirectBookingEnabled())"
  );
  const availabilityIndex = source.indexOf("voice-bot/availability");
  const bookIndex = source.indexOf('endpoint: "book"');
  assert.ok(guardIndex >= 0);
  assert.ok(guardIndex < availabilityIndex);
  assert.ok(guardIndex < bookIndex);
});

test("full-online flow calls send-invoice and never book", () => {
  const invoiceRoute = readFileSync(
    join(
      adminRoot,
      "app",
      "api",
      "simplotel",
      "booking",
      "send-invoice",
      "route.ts"
    ),
    "utf8"
  );
  const mobileService = readFileSync(
    join(repositoryRoot, "apps", "mobile", "src", "services", "simplotel.ts"),
    "utf8"
  );
  const handlerSource = readFileSync(join(adminRoot, "lib", "simplotel", "sendInvoiceHandler.ts"), "utf8");
  const guardIndex = handlerSource.indexOf(
    "requireBookingCreationEnabled(isFullOnlinePaymentEnabled())"
  );
  assert.equal(guardIndex, -1); // Dependencies are injected; exact wiring asserted below.
  assert.match(handlerSource, /requireBookingCreationEnabled\(deps\.enabled\(\)\)/);
  assert.match(handlerSource, /deps\.authorizeTest\(identity\)/);
  assert.ok(handlerSource.indexOf("requireBookingCreationEnabled(deps.enabled())") < handlerSource.indexOf("deps.authenticate"));
  assert.doesNotMatch(invoiceRoute, /console\./);
  assert.match(invoiceRoute, /enabled: isFullOnlinePaymentEnabled/);
  assert.match(invoiceRoute, /authorizeTest: requireServerControlledInvoiceTestAuthorization/);
  assert.match(invoiceRoute, /endpoint: 'send-invoice'/);
  assert.doesNotMatch(invoiceRoute, /endpoint: ['"]book['"]/);
  assert.match(mobileService, /api\/simplotel\/booking\/send-invoice/);
  assert.doesNotMatch(mobileService, /api\/simplotel\/booking[`"']/);
  assert.match(invoiceRoute, /inventoryHold: getInvoiceInventoryHold/);
  assert.match(invoiceRoute, /buildFullOnlineInvoicePayload\(core, hold\)/);
  assert.match(handlerSource, /buildPaymentLinkResult/);
  assert.doesNotMatch(mobileService, /holdInventory/);
});

test("mobile invoice success explicitly stays unconfirmed and payment pending", () => {
  const source = readFileSync(
    join(repositoryRoot, "apps", "mobile", "src", "screens", "BookingScreen.tsx"), "utf8"
  );
  const pending = source.slice(source.indexOf('{step === "paymentPending" && paymentLink'), source.indexOf(') : step === "summary"'));
  assert.match(pending, /value="Unconfirmed"/);
  assert.match(pending, /value="Payment pending"/);
  assert.match(pending, /temporarily held/);
  assert.match(pending, /until the inventory hold expires/);
  assert.doesNotMatch(pending, />Booking confirmed<|value="Paid"/);
});

test("mobile final action remains disabled when server capability is false", () => {
  const bookingScreenPath = join(
    repositoryRoot,
    "apps",
    "mobile",
    "src",
    "screens",
    "BookingScreen.tsx"
  );
  const source = readFileSync(bookingScreenPath, "utf8");
  const finalAction = source.match(
    /<Pressable[^>]*testID="booking-final-action"[^>]*>[\s\S]*?<\/Pressable>/
  )?.[0];

  assert.ok(finalAction, "Final booking action was not found.");
  assert.match(
    finalAction,
    /disabled=\{!preparation\.paymentCreationEnabled \|\| submitting \|\| !searchRequest \|\| !selectedRate\}/
  );
  assert.match(finalAction, /onPress=\{handleCreatePaymentLink\}/);
  assert.match(finalAction, /Payment not yet enabled/);
});
