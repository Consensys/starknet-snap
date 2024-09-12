import type { SnapConfig } from '@metamask/snaps-cli';
import { resolve } from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
require('dotenv').config();

const config: SnapConfig = {
  bundler: 'webpack',
  input: resolve(__dirname, 'src/index.tsx'),
  server: {
    port: 8081,
  },
  environment: {
    /* eslint-disable */
    SNAP_ENV: process.env.SNAP_ENV ?? 'prod',
    VOYAGER_API_KEY: process.env.VOYAGER_API_KEY ?? '',
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY ?? '',
    LOG_LEVEL: process.env.LOG_LEVEL ?? '0',
    /* eslint-disable */
  },
  polyfills: true,
};

export default config;
