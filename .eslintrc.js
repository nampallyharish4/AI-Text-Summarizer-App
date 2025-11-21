module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    
    // General code quality
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error', // Enforce template literals (JS-0246)
    'no-concat': 'off', // Handled by prefer-template
    
    // Disable AngularJS-specific rules for React/Node projects
    'angular/timeout-service': 'off',
    'angular/window-service': 'off',
    'angular/document-service': 'off',
    'angular/interval-service': 'off',
  },
  overrides: [
    // Backend files - disable AngularJS and restricted globals rules
    {
      files: ['server/**/*.js', 'netlify/functions/**/*.js'],
      env: {
        node: true,
        browser: false,
      },
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
    // TypeScript files
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // TypeScript handles these
        'no-undef': 'off',
      },
    },
  ],
};
