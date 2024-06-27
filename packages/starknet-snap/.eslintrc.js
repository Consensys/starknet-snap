module.exports = {
  parserOptions: {
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },

  extends: ['@metamask/eslint-config'],

  overrides: [
    {
      files: ['*.js'],
      extends: ['@metamask/eslint-config-nodejs'],
    },
    {
      files: ['*.ts', '*.tsx'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        'valid-jsdoc': 'off',
        'jsdoc/require-description': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-param-description': 'off',
        'jsdoc/match-description': 'off',
      },
    },
    {
      files: ['*.test.ts', '*.test.js'],
      extends: ['@metamask/eslint-config-jest'],
      rules: {
        '@typescript-eslint/no-shadow': ['error', { allow: ['describe', 'expect', 'it'] }],
        '@typescript-eslint/unbound-method': 'off',
      },
    },
    {
      files: ['snap.config.ts'],
      extends: ['@metamask/eslint-config-nodejs'],
    },
    {
      files: ['*.ts'],
      rules: {
        'import/no-nodejs-modules': 'off',
      },
    },
  ],
  ignorePatterns: [
    '!.prettierrc.js',
    '**/!.eslintrc.js',
    '**/dist*/',
    '**/*__GENERATED__*',
    '**/build',
    '**/public',
    '**/.cache',
    '**/test',
  ],
};
