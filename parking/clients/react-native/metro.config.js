const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ../shared lives outside this project, so Metro has to be told to watch it.
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '../shared')];

module.exports = config;
