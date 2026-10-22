/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background/quit-state message handler before component registration
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Background messages are handled by the OS notification tray.
  // This handler prevents crashes on some Android devices.
  console.log('Background message:', remoteMessage.messageId);
});

// Emulators have no store billing, so RevenueCat errors on every dev launch; the
// overlay hid bottom buttons. Real devices still log it to the console.
LogBox.ignoreLogs(['[RevenueCat]']);

AppRegistry.registerComponent(appName, () => App);
