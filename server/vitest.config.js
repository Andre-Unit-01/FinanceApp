// Vitest uses this configuration to run the backend integration tests.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
  },
});
