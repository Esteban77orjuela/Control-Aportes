const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.sourceExts.push('mjs');

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@/components': path.resolve(__dirname, 'src/components'),
  '@/hooks': path.resolve(__dirname, 'src/hooks'),
  '@/utils': path.resolve(__dirname, 'src/utils'),
  '@/styles': path.resolve(__dirname, 'src/styles'),
  '@/types': path.resolve(__dirname, 'src/types'),
  '@/lib': path.resolve(__dirname, 'src/lib'),
  '@/data': path.resolve(__dirname, 'src/data'),
  '@/pwa': path.resolve(__dirname, 'src/pwa'),
  '@/application': path.resolve(__dirname, 'src/application'),
};

config.resolver.platforms = ['web', 'native', 'ios', 'android'];

module.exports = config;