const BLOCKED_BETA_ANDROID_PERMISSIONS = [
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.SYSTEM_ALERT_WINDOW",
];

function isPrivateIpv4(hostname) {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part))) {
    return false;
  }

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function requirePublicHttpsBackend(rawValue) {
  let url;
  try {
    url = new URL(rawValue);
  } catch {
    throw new Error(
      "Beta builds require EXPO_PUBLIC_API_BASE_URL to be an approved public HTTPS backend.",
    );
  }

  const hostname = url.hostname.toLowerCase();
  const localHostname =
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    isPrivateIpv4(hostname);

  if (
    url.protocol !== "https:" ||
    localHostname ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !hostname.endsWith(".lambda-url.ap-south-1.on.aws")
  ) {
    throw new Error(
      "Beta builds require EXPO_PUBLIC_API_BASE_URL to be an ap-south-1 Lambda Function URL.",
    );
  }
}

module.exports = ({ config }) => {
  const releaseProfile = ["beta", "play-internal"].includes(
    process.env.EAS_BUILD_PROFILE,
  );
  if (releaseProfile) {
    if (process.env.EXPO_PUBLIC_AWS_REGION !== "ap-south-1") {
      throw new Error("Beta builds require EXPO_PUBLIC_AWS_REGION to be ap-south-1.");
    }
    requirePublicHttpsBackend(process.env.EXPO_PUBLIC_API_BASE_URL ?? "");
  }

  return {
    ...config,
    android: {
      ...config.android,
      ...(releaseProfile
        ? { blockedPermissions: BLOCKED_BETA_ANDROID_PERMISSIONS }
        : {}),
    },
    extra: {
      ...config.extra,
      releaseChannel: releaseProfile ? "beta" : "development",
    },
  };
};
