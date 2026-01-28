const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package exports support (critical for MUI v6+)
config.resolver.unstable_enablePackageExports = true;

// Ensure we resolve .mjs, .js, .jsx, .ts, .tsx, .cjs
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

module.exports = config;
