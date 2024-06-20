// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = (env) => merge(common, {
  mode: 'production',
  output: {
    publicPath: 'https://staging.snaps.consensys.io/starknet/get-starknet/v1/', 
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'MetaMaskStarknetSnapWallet',
      filename: 'remoteEntry.js',
      exposes: {
        './index': './src/index.ts',
      },
    }),
  ],
});