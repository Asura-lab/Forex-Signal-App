// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable package.json `exports` field resolution (required for axios browser build)
config.resolver.unstable_enablePackageExports = true;

// Prefer the `browser` condition so packages like axios use their browser
// builds instead of Node.js builds (which require Node built-ins like 'crypto')
config.resolver.unstable_conditionNames = ['browser', 'require', 'default'];

// Fallback: if Metro still resolves the Node crypto built-in, shim it to
// react-native-get-random-values which provides a compatible crypto.getRandomValues
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  crypto: require.resolve('react-native-get-random-values'),
};

module.exports = config;
