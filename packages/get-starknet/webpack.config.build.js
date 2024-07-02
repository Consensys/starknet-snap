// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
const webpack = require('webpack');
// eslint-disable-next-line @typescript-eslint/no-var-requires
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.js');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ModuleFederationPlugin } = require('webpack').container;

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = (env) =>
  merge(common, {
    mode: 'production',
    output: {
      publicPath: process.env.GET_STARKNET_PUBLIC_PATH || 'https://snaps.consensys.io/starknet/get-starknet/v1/',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.SNAP_ID': JSON.stringify(process.env.SNAP_ID || 'npm:@consensys/starknet-snap'),
      }),
      new ModuleFederationPlugin({
        name: 'MetaMaskStarknetSnapWallet',
        filename: 'remoteEntry.js',
        exposes: {
          './index': './src/index.ts',
        },
      }),
    ],
  });
