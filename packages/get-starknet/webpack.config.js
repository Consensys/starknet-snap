// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ModuleFederationPlugin } = require('webpack').container;
// eslint-disable-next-line @typescript-eslint/no-var-requires  
const path = require('path');

module.exports = {  
  mode: 'production',  
  entry: './src/index.ts',  
  output: {  
    path: path.resolve(__dirname, './dist/webpack'),
    filename: 'index.js',  
    publicPath: 'https://s3.eu-central-1.amazonaws.com/dev.snaps.consensys.io/get-starknet2/', 
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
    new ModuleFederationPlugin({  
      name: 'MetaMaskStarknetSnapWallet',  
      filename: 'remoteEntry.js',  
      exposes: {  
        './index': './src/index.ts',  
      },  
    }),  
  ],  
};  