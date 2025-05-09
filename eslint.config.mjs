import js from "@eslint/js"
import globals from "globals"
import reactPlugin from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import stylistic from "@stylistic/eslint-plugin"
import { defineConfig } from "eslint/config"

export default defineConfig([
  {
    name: "me/js-rules",
    plugins: { js },
    extends: [
      "js/recommended"
    ]
  },
  {
    name: "me/browser-rules",
    languageOptions: { globals: globals.browser }
  },
  {
    name: "me/node-rules",
    languageOptions: { globals: globals.node }
  },
  {
    name: "me/react-rules",
    plugins: { react: reactPlugin },
    extends: [
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat["jsx-runtime"]
    ],
    rules: {
      "react/prop-types": "off"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    name: "me/react-hooks-rules",
    plugins: { "react-hooks": reactHooks }
  },
  {
    name: "me/stylistic-rules",
    plugins: { "@stylistic": stylistic },
    extends: [stylistic.configs.recommended],
    rules: {
      "@stylistic/arrow-parens": ["error", "always"],
      "@stylistic/brace-style": ["error", "1tbs"],
      "@stylistic/comma-dangle": ["error", "never"],
      "@stylistic/jsx-first-prop-new-line": ["error", "multiline"],
      "@stylistic/jsx-one-expression-per-line": ["error", { allow: "non-jsx" }],
      "@stylistic/jsx-quotes": ["error", "prefer-double"],
      "@stylistic/multiline-ternary": ["error", "always-multiline"],
      "@stylistic/quotes": ["error", "double"]
    }
  },
  {
    ignores: [
      ".next/**",
      "app/api/test/**",
      "components/ui/**"
    ]
  }
])
