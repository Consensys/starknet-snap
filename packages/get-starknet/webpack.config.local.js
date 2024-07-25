// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const { merge } = require('webpack-merge');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires

module.exports = (env) =>
  merge(common, {
    mode: 'development',
    output: {
      publicPath: process.env.GET_STARKNET_PUBLIC_PATH || 'http://localhost:8082/', // Adjust the development publicPath as needed
    },
    devServer: {
      static: path.join(__dirname, 'dist/webpack'),
      compress: true,
      port: 8082,
    },
  });
