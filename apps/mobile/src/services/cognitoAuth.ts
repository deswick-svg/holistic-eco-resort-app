import 'react-native-get-random-values';
import { Amplify } from 'aws-amplify';
import { ConsoleLogger } from 'aws-amplify/utils';
import { NativeModules, Platform } from 'react-native';
import {
  signIn, confirmSignIn, signOut, signUp, confirmSignUp, resendSignUpCode,
  fetchAuthSession, resetPassword, confirmResetPassword,
  confirmUserAttribute, sendUserAttributeVerificationCode,
} from 'aws-amplify/auth';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import * as SecureStore from 'expo-secure-store';
import { awsConfig } from './aws';
import { SecureAuthStorage } from './secureAuthStorage';
import { CognitoAuthCore } from './cognitoAuthCore';

const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const storage = new SecureAuthStorage({
  getItemAsync: key => SecureStore.getItemAsync(key, options),
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value, options),
  deleteItemAsync: key => SecureStore.deleteItemAsync(key, options),
});

// Public pool/client identifiers, not AWS credentials. No identity pool or backend deployment.
ConsoleLogger.LOG_LEVEL = 'NONE';
Amplify.configure({
  Auth: { Cognito: {
    userPoolId: awsConfig.cognitoUserPoolId,
    userPoolClientId: awsConfig.cognitoClientId,
    loginWith: { email: true },
  } },
});
// configure() resets the SDK token store: override AFTER configure, before any operation.
cognitoUserPoolsTokenProvider.setKeyValueStorage(storage);

export const cognitoAuth = new CognitoAuthCore({
  prepare: async () => {
    if (Platform.OS === 'web' || !NativeModules.AmplifyRTNCore || !(await SecureStore.isAvailableAsync())) {
      const error = new Error('Native authentication setup required');
      error.name = 'NativeSetupRequired';
      throw error;
    }
    if (!awsConfig.cognitoUserPoolId.startsWith(`${awsConfig.region}_`) || !awsConfig.cognitoClientId) {
      const error = new Error('Invalid authentication configuration');
      error.name = 'AuthConfigurationError';
      throw error;
    }
  },
  signIn: (email, password) => signIn({ username: email, password, options: { authFlowType: 'USER_SRP_AUTH' } }),
  confirmSignIn: response => confirmSignIn({ challengeResponse: response }),
  session: async forceRefresh => {
    const hadSession = !!(await storage.getItem(`CognitoIdentityServiceProvider.${awsConfig.cognitoClientId}.LastAuthUser`));
    const session = await fetchAuthSession({ forceRefresh });
    if (hadSession && !session.tokens) {
      const error = new Error('Session expired');
      error.name = 'UserUnAuthenticatedException';
      throw error;
    }
    return { id: session.tokens?.idToken?.payload, access: session.tokens?.accessToken.payload };
  },
  signOut: () => signOut(),
  clear: () => storage.clear(),
  signUp: (email, password) => signUp({ username: email, password, options: { userAttributes: { email } } }),
  confirmEmail: (email, code) => confirmSignUp({ username: email, confirmationCode: code }),
  confirmVerifiedEmail: code => confirmUserAttribute({ userAttributeKey: 'email', confirmationCode: code }),
  resendVerifiedEmail: () => sendUserAttributeVerificationCode({ userAttributeKey: 'email' }),
  resend: email => resendSignUpCode({ username: email }),
  reset: email => resetPassword({ username: email }),
  confirmReset: (email, code, password) => confirmResetPassword({ username: email, confirmationCode: code, newPassword: password }),
}, awsConfig);
