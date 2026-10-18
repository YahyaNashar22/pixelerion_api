import { defineConfig } from "@playwright/test";

import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const run = Date.now().toString();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,

  outputDir: path.join(root, ".tmp", "browser-results"),

  use: {
    baseURL: "http://localhost:18443",
    actionTimeout: 10000,
    channel: process.platform === "win32" ? "chrome" : undefined,
    trace: "retain-on-failure",
  },

  webServer: [
    {
      command: "go run ../cmd/api",
      url: "http://localhost:18080/health",
      timeout: 120000,
      reuseExistingServer: false,

      env: {
        GOTOOLCHAIN: "local",
        GOCACHE: path.join(root, ".tmp", "go-build"),
        HTTP_PORT: "18080",
        PUBLIC_URL: "http://localhost:18443",
        APP_ENV: "test",
        SQLITE_PATH: path.join(root, ".tmp", "e2e-" + run + ".db"),
        UPLOAD_DIR: path.join(root, ".tmp", "e2e-uploads-" + run),
        BOOTSTRAP_ADMIN_USERNAME: "e2e-admin",
        BOOTSTRAP_ADMIN_EMAIL: "e2e-admin@example.com",
        BOOTSTRAP_ADMIN_PASSWORD: "E2e-admin-password-123",
        SMTP_USERNAME: "",
        SMTP_PASSWORD: "",
        SMTP_FROM: "",
        SUPPORT_EMAIL: "",
      },
    },

    {
      command: "npm run dev",
      url: "http://localhost:18443",
      timeout: 60000,
      reuseExistingServer: false,

      env: { PORT: "18443", API_PROXY_TARGET: "http://localhost:18080" },
    },
  ],
});
