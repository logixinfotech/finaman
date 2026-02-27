module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
  ],
  rules: {
    'no-undef': 'error',
    // Add other rules as needed
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
};
