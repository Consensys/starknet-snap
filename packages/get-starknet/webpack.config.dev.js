// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
module.exports = merge(common, {
  mode: 'development',
  output: {
    publicPath: 'http://localhost:8082/', // Adjust the development publicPath as needed
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 8082,
  },
});