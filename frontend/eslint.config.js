import js from "@eslint/js";
import react from "eslint-plugin-react";

export default [
  js.configs.recommended,
  {
    plugins: { react },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { window: true, document: true, console: true, fetch: true, confirm: true, setTimeout: true, clearTimeout: true }
    },
    rules: {
      "react/react-in-jsx-scope": "off"
    }
  }
];