import {FlatCompat} from "@eslint/eslintrc"
import unicorn from "eslint-plugin-unicorn"

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const config = [
  ...compat.config({
    extends: ["next/core-web-vitals", "plugin:tailwindcss/recommended"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "tailwindcss/no-custom-classname": "off",
    },
  }),
  unicorn.configs["recommended"],
  {
    rules: {
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-null": "off",
      "unicorn/filename-case": ["error", {
        "cases": {
          "camelCase": true,
          "pascalCase": true,
          "kebabCase": true
        }
      }]
    },
  }
]

export default config