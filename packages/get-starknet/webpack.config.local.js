// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  mode: 'development',
  output: {
    publicPath: process.env.GET_STARKNET_PUBLIC_PATH ?? 'http://localhost:8082/', // Adjust the development publicPath as needed
  },
  devServer: {
    static: path.join(__dirname, 'dist/webpack'),
    compress: true,
    port: 8082,
  }
};
