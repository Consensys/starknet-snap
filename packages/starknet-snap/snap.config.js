import * as dotenv from "dotenv";
dotenv.config();

module.exports = {
    bundler: "webpack",
    environment: {
        SNAP_ENV: process.env.SNAP_ENV ?? "prod",
        VOYAGER_API_KEY: process.env.VOYAGER_API_KEY ?? "",
        ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY ?? "",
    },
    input: "./src/index.ts",
    server: {
        port: 8081,
    },
    polyfills: true
};
