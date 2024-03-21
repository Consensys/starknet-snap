import * as dotenv from "dotenv";
dotenv.config();

module.exports = {
    bundler: "webpack",
    environment: {
        SNAP_ENV: process.env.SNAP_ENV,
    },
    input: "./src/index.ts",
    server: {
        port: 8081,
    },
    polyfills: true
};
