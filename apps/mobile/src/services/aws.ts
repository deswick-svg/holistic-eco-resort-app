function publicEnv(name: string, fallback = '') {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

/**
 * Public AWS boundary. Expo reads apps/mobile/.env into EXPO_PUBLIC_*.
 * EAS preview must set the same names for a cloud build.
 * Missing values fail closed in sign-in.
 */
export const awsConfig = {
  region: publicEnv('EXPO_PUBLIC_AWS_REGION'),
  apiBaseUrl: publicEnv('EXPO_PUBLIC_API_BASE_URL').replace(/\/+$/, ''),
  cognitoUserPoolId: publicEnv('EXPO_PUBLIC_COGNITO_USER_POOL_ID'),
  cognitoClientId: publicEnv('EXPO_PUBLIC_COGNITO_CLIENT_ID'),
  guestGroup: publicEnv('EXPO_PUBLIC_COGNITO_GUEST_GROUP', 'Guests'),
  employeeGroup: publicEnv('EXPO_PUBLIC_COGNITO_EMPLOYEE_GROUP', 'Employees'),
};
