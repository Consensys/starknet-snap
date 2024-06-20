const Dotenv = require('dotenv-webpack');
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
    publicPath: 'http://localhost:8082/', // Adjust the development publicPath as needed
  },
  devServer: {
    static: path.join(__dirname, 'dist/webpack'),
    compress: true,
    port: 8082,
  },
  plugins: [
    new Dotenv(),
    new webpack.DefinePlugin({
        'process.env.SNAP_ID': process.env.SNAP_ID
    })
  ]
});
