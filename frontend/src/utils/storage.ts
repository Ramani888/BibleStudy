import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@bsp/access_token',
  REFRESH_TOKEN: '@bsp/refresh_token',
  AI_POLICY_ACCEPTED: '@bsp/ai_policy_accepted',
  TOS_ACCEPTED: '@bsp/tos_accepted',
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
};
