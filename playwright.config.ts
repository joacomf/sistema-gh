import {defineConfig, devices} from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Para base de datos de test secuencial
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx next start -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: false,
    env: {
      PLAYWRIGHT_TEST: 'true',
      AUTH_TRUST_HOST: 'true',
      AUTH_SECRET: process.env.AUTH_SECRET || '73f353d214d39711ebf89a17a2c8d994de36525883d761b2ea4b7b8520bf2a25',
      DATABASE_URL: process.env.TEST_DATABASE_URL || 'mysql://root:root@localhost:3307/sistema_test'
    }
  },
});
