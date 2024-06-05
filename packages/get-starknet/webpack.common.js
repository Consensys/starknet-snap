// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, './dist/webpack'),
    filename: 'index.js',
    library: {
      type: 'commonjs2',
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new Dotenv(),
    new webpack.DefinePlugin({
        'process.env.SNAP_ID': JSON.stringify(process.env.SNAP_ID || 'npm:@consensys/starknet-snap')
    })
  ]
};