module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json', '.node'],
        alias: {
          '@components': './src/components',
          '@theme': './src/theme',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@api': './src/api',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@types': './src/types',
        },
      },
    ],
  ],
};
