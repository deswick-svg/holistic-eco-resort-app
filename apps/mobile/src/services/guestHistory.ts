import './cognitoAuth'; // Keep the existing SecureStore token provider initialized.
import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from './aws';
import { createGuestHistoryClient } from './guestHistoryCore';

export const loadGuestHistory = createGuestHistoryClient({
  // Development and release builds both require an explicit backend origin.
  baseUrl: awsConfig.apiBaseUrl.replace(/\/+$/, ''),
  allowLocalHttp: __DEV__,
  fetcher: fetch,
  session: async () => {
    const { tokens } = await fetchAuthSession();
    const access = tokens?.accessToken;
    if (!access || typeof access.payload.sub !== 'string') return null;
    return { token: access.toString(), sub: access.payload.sub };
  },
});
