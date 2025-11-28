// @ts-check

import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintRecommended from '@eslint/js';

export default tseslint.config(
  // Archivos a ignorar
  {
    ignores: [
      'dist/',
      'node_modules/',
      'eslint.config.mjs',
      'coverage/',
      '*.config.js',
      'prisma/migrations/',
    ],
  },

  // Configuraciones base recomendadas
  eslintRecommended.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginPrettierRecommended,

  // Configuración principal
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es2021,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },

    rules: {
      // ===========================
      // TypeScript Rules - Strict
      // ===========================
      '@typescript-eslint/no-explicit-any': 'warn', // Permitido con warning
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Tipos inferidos ok
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off', // Muy estricto para Express
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: ['constructors'], // Permitir constructores vacíos (Singleton pattern)
        },
      ],

      // ===========================
      // Seguridad y Best Practices
      // ===========================
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-await': 'off', // Reemplazado por @typescript-eslint
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      'no-throw-literal': 'off', // Reemplazado por @typescript-eslint
      '@typescript-eslint/only-throw-error': 'error',
      'require-await': 'off', // Reemplazado por @typescript-eslint
      '@typescript-eslint/require-await': 'error',

      // ===========================
      // Node.js / Express Específico
      // ===========================
      'no-process-exit': 'warn',
      'handle-callback-err': 'off', // Deprecado en favor de promesas
      'no-path-concat': 'error',

      // ===========================
      // Code Quality
      // ===========================
      'no-duplicate-imports': 'error',
      'no-else-return': ['warn', { allowElseIf: false }],
      'no-lonely-if': 'warn',
      'no-unneeded-ternary': 'warn',
      'no-useless-return': 'warn',
      'prefer-const': 'error',
      'prefer-template': 'warn',
      'object-shorthand': ['warn', 'always'],
      'prefer-arrow-callback': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],

      // ===========================
      // Complejidad
      // ===========================
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-nested-callbacks': ['warn', 3],
      'max-params': ['warn', 5],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],

      // ===========================
      // Imports / Exports
      // ===========================
      'no-restricted-imports': 'off', // Permitir imports relativos en backend

      // ===========================
      // Comentarios
      // ===========================
      'no-warning-comments': [
        'warn',
        {
          terms: ['TODO', 'FIXME', 'XXX', 'HACK'],
          location: 'start',
        },
      ],

      // ===========================
      // Prettier Compatibility
      // ===========================
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },

  // Configuración específica para archivos de test
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
    },
  },

  // Configuración específica para archivos de configuración
  {
    files: ['src/config/**/*.ts', 'prisma/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  }
);
