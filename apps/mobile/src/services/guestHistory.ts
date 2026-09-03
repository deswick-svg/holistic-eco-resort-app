import './cognitoAuth'; // Keep the existing SecureStore token provider initialized.
import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from './aws';
import { createGuestHistoryClient } from './guestHistoryCore';

export const loadGuestHistory = createGuestHistoryClient({
  // USB development only; release builds require an explicit HTTPS backend.
  baseUrl: awsConfig.apiBaseUrl || (__DEV__ ? 'http://127.0.0.1:3001' : ''),
  allowLocalHttp: __DEV__,
  fetcher: fetch,
  session: async () => {
    const { tokens } = await fetchAuthSession();
    const access = tokens?.accessToken;
    if (!access || typeof access.payload.sub !== 'string') return null;
    return { token: access.toString(), sub: access.payload.sub };
  },
});
