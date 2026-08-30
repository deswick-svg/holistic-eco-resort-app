/**
 * App-specific AWS boundary.
 * Expected production services: Cognito, API backend, RDS PostgreSQL,
 * S3/CloudFront media, CloudWatch and notifications.
 */
export const awsConfig = {
  region: process.env.EXPO_PUBLIC_AWS_REGION ?? '',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  cognitoUserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '',
  cognitoClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? '',
};
