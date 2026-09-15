declare module 'react-native-config' {
  interface NativeConfig {
    API_BASE_URL?: string;
    GOOGLE_IOS_CLIENT_ID?: string;
    GOOGLE_WEB_CLIENT_ID?: string;
    REVENUECAT_IOS_API_KEY?: string;
    REVENUECAT_ANDROID_API_KEY?: string;
    POSTHOG_API_KEY?: string;
    POSTHOG_HOST?: string;
  }
  const Config: NativeConfig;
  export default Config;
}
