import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@bsp/access_token',
  REFRESH_TOKEN: '@bsp/refresh_token',
  AI_POLICY_ACCEPTED: '@bsp/ai_policy_accepted',
  TOS_ACCEPTED: '@bsp/tos_accepted',
  ONBOARDING_SEEN: '@bsp/onboarding_seen',
  LANGUAGE_CODE: '@bsp/language_code',
} as const;

export const storage = {
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(KEYS.ACCESS_TOKEN, accessToken),
      AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(KEYS.REFRESH_TOKEN),
    ]);
  },

  async getAiPolicyAccepted(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.AI_POLICY_ACCEPTED)) === 'true';
  },

  async setAiPolicyAccepted(): Promise<void> {
    await AsyncStorage.setItem(KEYS.AI_POLICY_ACCEPTED, 'true');
  },

  async getTosAccepted(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.TOS_ACCEPTED)) === 'true';
  },

  async setTosAccepted(): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOS_ACCEPTED, 'true');
  },

  async getOnboardingSeen(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_SEEN);
    if (val !== null) return val === 'true';
    // Backwards compatibility check for legacy key
    const legacyVal = await AsyncStorage.getItem('@onboarding_seen');
    return legacyVal === 'true';
  },

  async setOnboardingSeen(seen = true): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_SEEN, seen ? 'true' : 'false');
  },

  async getLanguageCode(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.LANGUAGE_CODE);
  },

  async setLanguageCode(lang: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.LANGUAGE_CODE, lang);
  },
};
