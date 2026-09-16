module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier', // Desactiva reglas de ESLint que entran en conflicto con Prettier
  ],
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  env: {
    'react-native/react-native': true,
    jest: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off', // No es necesario en React 17+
    '@typescript-eslint/no-explicit-any': 'warn', // Te advertirá cuando uses 'any', útil para código estricto
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-require-imports': 'off', // React Native usa require() para assets estáticos (imágenes)
    'react-native/no-unused-styles': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/prefer-as-const': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
