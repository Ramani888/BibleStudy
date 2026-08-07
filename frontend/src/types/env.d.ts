declare module 'react-native-config' {
  interface NativeConfig {
    API_BASE_URL?: string;
    GOOGLE_IOS_CLIENT_ID?: string;
    GOOGLE_WEB_CLIENT_ID?: string;
  }
  const Config: NativeConfig;
  export default Config;
}
