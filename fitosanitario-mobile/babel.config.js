module.exports = function (api) {
  api.cache(true);

  return {
    // NOTE: `nativewind/babel` (NativeWind v4) is a Babel *preset* (it returns `{ plugins: [...] }`).
    // It must be listed under `presets`, not `plugins`.
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [],
  };
};