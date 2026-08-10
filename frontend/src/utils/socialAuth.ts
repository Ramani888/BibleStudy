import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import Config from 'react-native-config';

// Call once at app start (App.tsx)
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    iosClientId: Config.GOOGLE_IOS_CLIENT_ID,
    webClientId: Config.GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
}

export async function getGoogleIdToken(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  if (result.type === 'cancelled') {
    throw Object.assign(new Error('Sign-in cancelled'), { code: statusCodes.SIGN_IN_CANCELLED });
  }
  const tokens = await GoogleSignin.getTokens();
  if (!tokens.idToken) throw new Error('Google Sign-In failed — no ID token');
  return tokens.idToken;
}

function randomNonce(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function getAppleCredentials() {
  const nonce = randomNonce();
  const response = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes:    [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    nonce,
  });

  if (!response.identityToken) throw new Error('Apple Sign-In failed — no identity token');

  return {
    identityToken: response.identityToken,
    nonce,
    email: response.email ?? undefined,
    fullName: response.fullName
      ? {
          givenName:  response.fullName.givenName  ?? undefined,
          familyName: response.fullName.familyName ?? undefined,
        }
      : undefined,
  };
}

export { statusCodes as googleStatusCodes };
