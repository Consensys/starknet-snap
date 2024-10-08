module.exports = {
  extends: ['../../.eslintrc.js'],

  parserOptions: {
    tsconfigRootDir: __dirname,
  },

  overrides: [
    {
      files: ['snap.config.ts'],
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
      files: ['*.test.ts'],
      extends: ['@metamask/eslint-config-jest'],
      rules: {
        '@typescript-eslint/no-shadow': ['error', { allow: ['describe', 'expect', 'it'] }],
        '@typescript-eslint/unbound-method': 'off',
      },
    },

    {
      files: ['*.ts'],
      rules: {
        'import/no-nodejs-modules': 'off',
      },
    },
  ],

  ignorePatterns: ['!.eslintrc.js', 'dist/', '**/test', '.nyc_output/', 'coverage/', 'webpack.*.js'],
};
