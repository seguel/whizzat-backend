// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/generated/**',
      'eslint.config.mjs',
    ],
  },

  eslint.configs.recommended,

  // Regras TypeScript sem análise completa de tipos
  ...tseslint.configs.recommended,

  // Mantém integração com Prettier
  eslintPluginPrettierRecommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
    },
  },

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',

      // Estas regras exigem análise de tipos,
      // portanto ficam desativadas neste modo.
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
);
