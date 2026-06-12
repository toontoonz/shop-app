import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * Module-boundary patterns for `no-restricted-imports`.
 *
 * Goal: only the barrel `@/modules/{name}` (= the `index.ts` in that module folder)
 * may be imported from outside the module. Direct imports into a module's internal
 * layers (`domain`, `repositories`, `services`, `queries`, `ui`) are forbidden.
 *
 * Files inside a module use relative paths to import their own internals,
 * so a global rule is sufficient — no per-module overrides required.
 */
const moduleBoundaryPatterns = [
  "@/modules/*/domain",
  "@/modules/*/domain/**",
  "@/modules/*/repositories",
  "@/modules/*/repositories/**",
  "@/modules/*/services",
  "@/modules/*/services/**",
  "@/modules/*/queries",
  "@/modules/*/queries/**",
  "@/modules/*/ui",
  "@/modules/*/ui/**",
];

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: moduleBoundaryPatterns,
              message:
                "Import modules only via their barrel: '@/modules/{name}'. Deep imports into a module's internal layers (domain/repositories/services/queries/ui) are forbidden — use relative paths within the same module instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // Application layer (pages, route handlers) may import any module layer.
    // The boundary rule is for cross-module imports (module A importing module B's internals).
    files: ["src/app/**/*", "src/lib/**/*", "tests/**/*"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "src/components/ui/**",
    ],
  },
];

export default eslintConfig;
