const { ModuleFederationPlugin } = require('webpack').container;  
const path = require('path');

module.exports = {  
  mode: 'production',  
  entry: './src/index.ts',  
  output: {  
    path: path.resolve(__dirname, './webpack'),
    filename: 'index.js',  
    publicPath: 'https://mmsnap-get-starknet.s3.eu-west-2.amazonaws.com/', 
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