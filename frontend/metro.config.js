const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// react-native-webview's "react-native" package.json field points to src/index.ts,
// which imports ./WebView — but Metro cannot resolve .tsx platform files inside
// node_modules with RN 0.84's bundler. Redirect to the pre-compiled lib/ instead.
const config = {
  resolver: {
    extraNodeModules: {
      'react-native-webview': path.resolve(__dirname, 'node_modules/react-native-webview/lib'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
