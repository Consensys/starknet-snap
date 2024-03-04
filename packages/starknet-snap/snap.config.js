import envify from "envify/custom";

module.exports = {
  cliOptions: {
    dist: 'dist',
    outfileName: 'bundle.js',
    src: './src/index.ts',
  },
  bundlerCustomizer: (bundler) => {
    bundler.transform(
      envify({
        SNAP_ENV: process.env.SNAP_ENV,
      }),
    );
  },
};