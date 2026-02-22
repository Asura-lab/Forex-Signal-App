// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Use browser condition when resolving package exports
// This ensures packages like axios use their browser builds
// instead of Node.js builds (which require Node.js built-ins like 'crypto')
config.resolver.unstable_conditionNames = ['browser', 'require', 'default'];

module.exports = config;
