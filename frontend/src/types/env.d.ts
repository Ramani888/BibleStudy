declare module 'react-native-config' {
  interface NativeConfig {
    API_BASE_URL?: string;
    DEV_ANDROID_HOST?: string;
  }
  const Config: NativeConfig;
  export default Config;
}
