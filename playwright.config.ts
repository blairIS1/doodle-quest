import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3010",
    headless: true,
  },
  webServer: {
    command: "npm run dev -- --port 3010",
    port: 3010,
    reuseExistingServer: true,
    timeout: 15000,
  },
});
