module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    // expo-router/babel foi removido: desde o SDK 50 já vem embutido em babel-preset-expo.
  };
};
