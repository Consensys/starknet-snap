const path = require('path');  
  
module.exports = {  
  mode: 'production',  
  entry: './dist/index.js',  
  output: {  
    filename: 'index.jsonp.js',  
    path: path.resolve(__dirname, 'jsonp'),  
    library: 'MetaMaskStarknetSnapWallet',  
    libraryTarget: 'jsonp',  
    libraryExport: 'default',  
  },  
};  