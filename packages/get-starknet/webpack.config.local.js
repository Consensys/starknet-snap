// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
module.exports = merge(common, {
  mode: 'development',
  output: {
    publicPath: process.env.GET_STARKNET_PUBLIC_PATH ?? 'http://localhost:8082/', // Adjust the development publicPath as needed
  },
  devServer: {
    static: path.join(__dirname, 'dist/webpack'),
    compress: true,
    port: 8082,
  },
  plugins: [
    new webpack.DefinePlugin({
        'process.env.SNAP_ID': JSON.stringify(process.env.SNAP_ID ?? 'http://localhost:8081/')
    })
  ]
});
