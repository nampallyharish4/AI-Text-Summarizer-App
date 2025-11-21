module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  overrides: [
    // Backend files - disable AngularJS and restricted globals rules
    {
      files: ['server/**/*.js', 'netlify/functions/**/*.js'],
      rules: {
        // Disable AngularJS-specific rules for Node.js backend
        'angular/timeout-service': 'off',
        'angular/window-service': 'off',
        'angular/document-service': 'off',
        'angular/interval-service': 'off',
        // Allow setTimeout in Node.js backend (not browser)
        'no-restricted-globals': 'off',
      },
      globals: {
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  ],
};

