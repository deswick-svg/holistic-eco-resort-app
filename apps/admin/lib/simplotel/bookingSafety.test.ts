import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const adminRoot = resolve(process.cwd());
const repositoryRoot = resolve(adminRoot, "..", "..");
const forbiddenUpstreamPath = ["voice-bot", "book"].join("/");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", ".next", "node_modules"].includes(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

test("repository contains no Simplotel POST /book target", () => {
  const offenders = sourceFiles(repositoryRoot).filter((path) =>
    readFileSync(path, "utf8").includes(forbiddenUpstreamPath)
  );
  assert.deepEqual(offenders, []);

  assert.equal(
    existsSync(join(adminRoot, "app", "api", "simplotel", "book", "route.ts")),
    false
  );
});

test("mobile final booking action is explicitly disabled and has no handler", () => {
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
  assert.match(finalAction, /disabled=\{true\}/);
  assert.doesNotMatch(finalAction, /onPress=/);
  assert.match(finalAction, /Booking not yet enabled/);
});
