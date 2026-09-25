import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from './aws';

export type DeletionPreparationResult =
  | { ok: true }
  | { ok: false; message: string };

export async function prepareAccountDeletion(): Promise<DeletionPreparationResult> {
  try {
    const { tokens } = await fetchAuthSession({ forceRefresh: true });
    const accessToken = tokens?.accessToken;
    if (!accessToken || !awsConfig.apiBaseUrl) {
      return { ok: false, message: 'Secure account deletion is unavailable. Please contact the resort.' };
    }
    const response = await fetch(`${awsConfig.apiBaseUrl}/api/account-deletion/prepare`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.toString()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' }),
    });
    if (!response.ok) return { ok: false, message: 'Your account could not be verified for deletion. Please sign in again or contact the resort.' };
    return { ok: true };
  } catch {
    return { ok: false, message: 'Unable to reach secure account deletion. Check your connection and try again.' };
  }
}
