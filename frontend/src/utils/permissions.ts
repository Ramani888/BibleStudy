import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Ensure CAMERA permission before launching the camera.
 * Android needs an explicit runtime request; iOS is governed by the Info.plist
 * usage string and the system prompt fired by the picker, so we return true.
 */
export async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
  if (already) return true;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
