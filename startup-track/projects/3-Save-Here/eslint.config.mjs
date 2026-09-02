import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals.map((config) => ({
    ...config,
    files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
  })),
  ...nextTypeScript.map((config) => ({
    ...config,
    files: ["apps/web/**/*.{ts,tsx}", "packages/domain/**/*.ts"],
  })),
  globalIgnores(["**/.next/**", "**/coverage/**", "**/node_modules/**"]),
]);
