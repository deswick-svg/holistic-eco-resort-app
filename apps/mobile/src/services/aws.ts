/**
 * App-specific AWS boundary.
 * Expected production services: Cognito, API backend, RDS PostgreSQL,
 * S3/CloudFront media, CloudWatch and notifications.
 */
export const awsConfig = {
  region: process.env.EXPO_PUBLIC_AWS_REGION ?? 'eu-north-1',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  cognitoUserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? 'eu-north-1_lszbPmAvq',
  cognitoClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? '3i8v47npf9eo1ihjfqdrh5qufr',
  guestGroup: 'Guests',
  employeeGroup: 'Employees',
};
