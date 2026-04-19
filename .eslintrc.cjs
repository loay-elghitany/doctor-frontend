module.exports = {
  root: true,
  env: {
    browser: true,
    es2024: true,
  },
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["react", "react-hooks"],
  extends: ["eslint:recommended", "plugin:react/recommended"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-react": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    "react/no-unknown-property": "error",
    "react/no-unsafe": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "react/jsx-no-duplicate-props": "error",
    "react/jsx-no-undef": "error",
    "no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", ignoreRestSiblings: true },
    ],
    "react/jsx-props-no-spreading": ["warn", { html: "enforce" }],
  },
  overrides: [
    {
      files: ["**/*.jsx"],
      rules: {
        "react/prop-types": "off",
      },
    },
  ],
};
