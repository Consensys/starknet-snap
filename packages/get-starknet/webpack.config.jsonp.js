const path = require('path');  
  
module.exports = {  
  mode: 'production',  
  entry: './src/index.ts',  
  output: {  
    path: path.resolve(__dirname, 'dist/jsonp'),  
    filename: 'index.jsonp.js',  
    library: 'MetaMaskStarknetSnapWallet',  
    libraryTarget: 'jsonp',  
    libraryExport: 'default',  
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
};  