/** Metro injects EXPO_PUBLIC_* into the bundle. This app does not run on Node. */
declare const process: {
  env: Record<string, string | undefined>;
};
