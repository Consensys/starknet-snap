// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  output: {
    publicPath: 'https://snaps.consensys.io/starknet/get-starknet/v1/', 
  },
});