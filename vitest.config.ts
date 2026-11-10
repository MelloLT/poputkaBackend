import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-test-secret-1234",
      INTERNAL_API_SECRET: "internal-secret-1234567890",
    },
  },
});
