import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: true, document: true, console: true,
        fetch: true, confirm: true, setTimeout: true,
        clearTimeout: true
      }
    },
    rules: {
      "no-unused-vars": "warn"
    }
  }
];