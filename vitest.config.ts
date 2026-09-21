import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/*
 * Vitest projects: storybook, components, and actions.
 */
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  // next/link reads process.env at import time, which browser tests lack.
  define: {
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'storybook/test',
      '@testing-library/dom',
      'aria-query',
      'lz-string',
      'pretty-format',
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'components',
          include: ['src/components/**/*.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'actions',
          environment: 'node',
          include: ['tests/actions/**/*.test.ts'],
          globalSetup: './tests/actions/globalSetup.ts',
          setupFiles: './tests/actions/setup.ts',
          env: {
            DATABASE_URL: 'file:./prisma/test.db',
          },
          fileParallelism: false,
          maxWorkers: 1,
          pool: 'forks',
        },
      },
    ],
  },
});
