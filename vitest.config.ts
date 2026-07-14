import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest is scoped to pure server/domain code (`src/lib/**`).
 * React component/DOM tests would require a jsdom environment
 * and duplicate the Playwright smoke-suite; keep them there.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.ts", "tests/unit/**/*.test.ts"],
    passWithNoTests: false,
    reporters: ["default"],
  },
});
