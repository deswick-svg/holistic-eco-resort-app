import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);

test("beta deployment is standalone, API-only, and has a health route", () => {
  const config = readFileSync(new URL("next.config.ts", root), "utf8");
  const proxy = readFileSync(new URL("proxy.ts", root), "utf8");
  const health = readFileSync(new URL("app/api/health/route.ts", root), "utf8");

  assert.match(config, /output:\s*["']standalone["']/);
  assert.match(proxy, /BETA_API_ONLY/);
  assert.match(proxy, /startsWith\(["']\/api\//);
  assert.match(proxy, /status:\s*404/);
  assert.match(health, /status:\s*["']ok["']/);
  assert.doesNotMatch(health, /process\.env|token|credential|secret/i);
});

test("booking execution remains disabled by default", () => {
  const execution = readFileSync(
    new URL("lib/simplotel/bookingExecution.ts", root),
    "utf8",
  );
  assert.match(execution, /SIMPLOTEL_BOOKING_ENABLED/);
  assert.match(execution, /===\s*["']true["']/);
});
