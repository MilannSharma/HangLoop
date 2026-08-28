// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Completely block Metro from watching Android and iOS native build folders
config.resolver.blockList = [
  /.*\/android\/.*/,
  /.*\/dist-ios\/.*/,
];

module.exports = config;
