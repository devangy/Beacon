const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Setup SVG Transformer
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");
config.resolver.assetExts.push("svg");

// Apply NativeWind
module.exports = withNativeWind(config, {
  input: "./global.css"  // Ensure this path points to your actual CSS file if needed
});
