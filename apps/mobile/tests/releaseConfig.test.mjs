import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const cwd = new URL("..", import.meta.url);
const expoCli = fileURLToPath(
  new URL("../node_modules/expo/bin/cli", import.meta.url),
);

function resolveExpoConfig(apiBaseUrl, profile = "beta") {
  return spawnSync(
    process.execPath,
    [expoCli, "config", "--type", "public", "--json"],
    {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        EAS_BUILD_PROFILE: profile,
        EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
      },
    },
  );
}

test("beta config preserves identity, sets V1 metadata and official branding", () => {
  const result = resolveExpoConfig("https://beta-api.example.invalid");
  assert.equal(result.status, 0, result.stderr);

  const config = JSON.parse(result.stdout);
  assert.equal(config.name, "Holistic Eco-Resort");
  assert.equal(config.version, "1.0.1");
  assert.equal(config.android.package, "com.holisticecoresort.guest");
  assert.equal(config.android.versionCode, 4);
  assert.equal(config.ios.bundleIdentifier, "com.holisticecoresort.guest");
  assert.equal(config.ios.buildNumber, "1");
  assert.match(config.icon, /app-icon\.png$/);
  assert.match(config.android.adaptiveIcon.foregroundImage, /app-icon\.png$/);
  assert.deepEqual(config.android.blockedPermissions, [
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.SYSTEM_ALERT_WINDOW",
  ]);
  assert.equal(config.extra.releaseChannel, "beta");

  const splashPlugin = config.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
  );
  assert.ok(splashPlugin);
  assert.match(splashPlugin[1].image, /HER-_HER Logo Full\.png$/);
});

test("beta config fails closed without a public HTTPS backend", () => {
  for (const value of [
    "",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
    "http://192.168.1.100:3000",
    "https://10.0.0.2",
  ]) {
    const result = resolveExpoConfig(value);
    assert.notEqual(result.status, 0, `unexpectedly accepted ${value}`);
  }
});

test("internal beta profile produces installable tester artifacts", () => {
  const eas = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url)));
  assert.equal(eas.build.beta.distribution, "internal");
  assert.equal(eas.build.beta.android.buildType, "apk");
  assert.equal(eas.build.beta.ios.simulator, false);
  const backend = new URL(eas.build.beta.env.EXPO_PUBLIC_API_BASE_URL);
  assert.equal(backend.protocol, "https:");
  assert.match(backend.hostname, /\.lambda-url\.eu-north-1\.on\.aws$/);
});

test("Play internal profile produces a store-signed app bundle", () => {
  const eas = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url)));
  assert.equal(eas.build["play-internal"].distribution, "store");
  assert.equal(eas.build["play-internal"].android.buildType, "app-bundle");
  const backend = new URL(
    eas.build["play-internal"].env.EXPO_PUBLIC_API_BASE_URL,
  );
  assert.equal(backend.protocol, "https:");
  assert.match(backend.hostname, /\.lambda-url\.eu-north-1\.on\.aws$/);

  const config = resolveExpoConfig(backend.href, "play-internal");
  assert.equal(config.status, 0, config.stderr);
  const resolved = JSON.parse(config.stdout);
  assert.equal(resolved.android.package, "com.holisticecoresort.guest");
  assert.equal(resolved.android.versionCode, 4);
  assert.equal(resolved.extra.releaseChannel, "beta");
});
