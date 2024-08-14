module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the rule that uses 'source-map-loader'
      const sourceMapLoaderRule = webpackConfig.module.rules.find(
        rule => rule.loader && rule.loader.includes('source-map-loader')
      );

      if (sourceMapLoaderRule) {
        // Exclude the entire folder
        sourceMapLoaderRule.exclude = [
          ...(Array.isArray(sourceMapLoaderRule.exclude) ? sourceMapLoaderRule.exclude : [sourceMapLoaderRule.exclude]),
          /node_modules\/starknet-types-07\/dist/
        ];
      }

      return webpackConfig;
    },
  },
};