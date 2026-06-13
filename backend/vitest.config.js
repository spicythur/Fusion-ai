import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["utils.js"],
      thresholds: {
        lines: 80,
      },
    },
  },
});
