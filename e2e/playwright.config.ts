import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "tests",
  timeout: 180000,
  retries: 5,
  use: {
    viewport: null,
  },
};

export default config;