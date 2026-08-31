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
    );
  });
  assert.deepEqual(offenders, []);
});

test("server booking route checks the safety flag before upstream work", () => {
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
    "requireBookingCreationEnabled(isBookingCreationEnabled())"
  );
  const availabilityIndex = source.indexOf("voice-bot/availability");
  const bookIndex = source.indexOf('endpoint: "book"');
  assert.ok(guardIndex >= 0);
  assert.ok(guardIndex < availabilityIndex);
  assert.ok(guardIndex < bookIndex);
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
    /disabled=\{!preparation\.bookingCreationEnabled \|\| submitting\}/
  );
  assert.match(finalAction, /onPress=\{handleCreateBooking\}/);
  assert.match(finalAction, /Booking not yet enabled/);
});
