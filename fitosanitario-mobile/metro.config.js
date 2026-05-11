// Metro configuration for Expo + NativeWind v4
// This wires Tailwind (global.css) into Metro so `className` styles are generated.

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: './global.css',
});
