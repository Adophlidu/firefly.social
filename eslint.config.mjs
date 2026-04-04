import nextPlugin from '@next/eslint-plugin-next';
import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tailwindcss from 'eslint-plugin-tailwindcss';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig, globalIgnores } from 'eslint/config';
import renameJsx from './rules/eslint-plugin-rename-jsx.mjs';
import useClientNewline from './rules/eslint-plugin-use-client-newline.mjs';

/**
 * Import layers (high → low): app / components / modals → hooks → services & providers → store.
 * Lower layers must not import higher UI layers so state and IO stay reusable and testable.
 */
const importArchitecturalLayerZones = [
    {
        target: './apps/web/src/store',
        from: ['./apps/web/src/components', './apps/web/src/hooks', './apps/web/src/modals', './apps/web/src/app'],
        message:
            'Store is a low layer: do not import components, hooks, modals, or the Next app directory. Use helpers, services, providers, or types instead.',
    },
    {
        target: './apps/web/src/providers',
        from: ['./apps/web/src/components', './apps/web/src/hooks', './apps/web/src/modals'],
        message:
            'Providers sit below UI: do not import components, hooks, or modals. Prefer helpers, types, or lifting UI-specific code (e.g. modal refs) to services/hooks.',
    },
    {
        target: './apps/web/src/services',
        from: ['./apps/web/src/components', './apps/web/src/hooks', './apps/web/src/modals'],
        message: 'Services orchestrate domain work: do not import components, hooks, or modals.',
    },
    {
        target: './apps/web/src/hooks',
        from: ['./apps/web/src/components', './apps/web/src/modals'],
        message:
            'Hooks compose data and effects: do not import components or modals (use helpers or colocate UI logic in components).',
    },
];

export default defineConfig([
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    },
    globalIgnores([
        '.github',
        '**/.next/**',
        '**/.vercel/**',
        '**/next-env.d.ts',
        'apps/**/dist/**',
        'apps/**/build/**',
        'apps/**/prebuilt/**',
        'apps/**/public',
        'apps/**/src/locales',
        'apps/**/src/polyfills',
        '*.config.ts',
        '*.config.js',
        '*.config.cjs',
        '*.svg',
        'eslint.config.mjs',
        'vitest.config.ts',
        'setups',
        'rules',
        'packages/scripts',
        'packages/**/dist',
        'packages/**/node_modules',
    ]),
    {
        files: ['apps/web/src/libs/LoggerNative.ts'],
        rules: {
            'no-console': 'off',
        },
    },
    {
        plugins: {
            '@next/next': nextPlugin,
            react,
            'react-hooks': reactHooks,
            unicorn,
            import: importPlugin,
            'no-relative-import-paths': noRelativeImportPaths,
            'simple-import-sort': simpleImportSort,
            tailwindcss: tailwindcss,
            '@typescript-eslint': typescriptEslintEslintPlugin,
            'unused-imports': unusedImports,
            'rename-jsx': renameJsx,
            'use-client-newline': useClientNewline,
        },

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'script',

            parserOptions: {
                project: './apps/web/tsconfig.eslint.json',
                tsconfigRootDir: import.meta.dirname,
                warnOnUnsupportedTypeScriptVersion: false,
                allowAutomaticSingleRunInference: true,
            },
        },
        settings: {
            next: {
                // Monorepo: every Next app is a direct child of apps/. Glob picks up apps/web today and
                // future apps without editing this config. Non-Next workspaces under apps/ are fine as long
                // as at least one directory has app/ or pages/ (see @next/next/no-html-link-for-pages).
                rootDir: 'apps/*',
            },
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './apps/web/tsconfig.eslint.json',
                },
                node: true,
            },
            react: {
                version: 'detect',
            },
            tailwindcss: {
                callees: ['classNames'],
                cssFilesRefreshRate: 5_000,
                removeDuplicates: true,
                skipClassAttribute: false,
                whitelist: ['notranslate', 'public-.*'],
            },
        },
        rules: {
            'rename-jsx/rename-jsx-import': 'warn',
            'use-client-newline/require-newline-after-use-client': 'warn',
            'default-case-last': 'error',
            eqeqeq: 'error',
            'import/no-empty-named-blocks': 'warn',
            'import/no-named-default': 'warn',
            'import/no-useless-path-segments': 'warn',
            'import/no-webpack-loader-syntax': 'error',
            'no-bitwise': 'error',
            'no-compare-neg-zero': 'error',
            'no-cond-assign': 'error',
            'no-constant-binary-expression': 'error',
            'no-constant-condition': 'warn',
            'no-constructor-return': 'error',
            'no-control-regex': 'error',
            'no-debugger': 'warn',
            'no-console': 'warn',
            'no-div-regex': 'error',
            'no-duplicate-case': 'error',
            'no-empty-character-class': 'error',
            'no-empty-pattern': 'warn',
            'no-ex-assign': 'warn',
            'no-extra-bind': 'warn',
            'no-extra-boolean-cast': 'warn',
            'no-extra-label': 'warn',
            'no-global-assign': 'error',
            'no-invalid-regexp': 'error',
            'no-irregular-whitespace': 'warn',
            'no-label-var': 'error',
            'no-misleading-character-class': 'error',
            'no-multiple-empty-lines': [
                'error',
                {
                    max: 1,
                    maxEOF: 1,
                    maxBOF: 0,
                },
            ],
            'padding-line-between-statements': [
                'warn',
                // Require blank lines before and after function declarations (but allow consecutive)
                { blankLine: 'always', prev: '*', next: 'function' },
                { blankLine: 'always', prev: 'function', next: '*' },
                { blankLine: 'any', prev: 'function', next: 'function' },
                // Require blank lines before control flow statements (for/while/switch/try)
                { blankLine: 'always', prev: '*', next: ['for', 'while', 'switch', 'try'] },
                { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['for', 'while', 'switch', 'try'] },
                { blankLine: 'always', prev: ['for', 'while', 'switch', 'try'], next: '*' },
                // Require blank lines before and after export statements (but allow consecutive exports)
                { blankLine: 'always', prev: '*', next: 'export' },
                { blankLine: 'always', prev: 'export', next: '*' },
                { blankLine: 'any', prev: 'export', next: 'export' },
                // Require blank lines before and after class declarations
                { blankLine: 'always', prev: '*', next: 'class' },
                { blankLine: 'always', prev: 'class', next: '*' },
            ],
            'no-new-wrappers': 'error',
            'no-plusplus': 'error',
            'no-regex-spaces': 'error',
            'no-restricted-globals': ['error', 'event', 'name', 'length', 'closed'],
            'no-restricted-imports': ['error'],
            'no-script-url': 'error',
            'no-self-assign': 'error',
            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-sparse-arrays': 'error',
            'no-template-curly-in-string': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unneeded-ternary': 'warn',
            'no-unreachable-loop': 'error',
            'no-unsafe-finally': 'error',
            'no-unused-labels': 'warn',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-unused-vars-experimental': 'off',
            'no-useless-backreference': 'error',
            'no-useless-call': 'warn',
            'no-useless-catch': 'warn',
            'no-useless-concat': 'warn',
            'no-useless-escape': 'warn',
            'no-useless-rename': 'warn',
            'object-shorthand': 'warn',
            'prefer-const': 'warn',
            'prefer-numeric-literals': 'warn',
            'prefer-object-has-own': 'warn',
            'prefer-regex-literals': 'warn',
            radix: 'warn',

            'spaced-comment': [
                'warn',
                'always',
                {
                    line: {
                        markers: ['/'],
                    },
                },
            ],

            'unused-imports/no-unused-imports': 'error',
            'valid-typeof': 'error',
            yoda: 'warn',
            'react/jsx-no-comment-textnodes': 'warn',
            'react/jsx-no-leaked-render': 'error',
            'react/jsx-no-script-url': 'error',
            'react/no-danger': 'error',
            'react/no-danger-with-children': 'error',
            'react/no-namespace': 'error',
            'react/no-unstable-nested-components': 'error',
            'react/void-dom-elements-no-children': 'error',
            'react/no-invalid-html-attribute': 'warn',

            'react/jsx-key': [
                'warn',
                {
                    checkFragmentShorthand: true,
                    checkKeyMustBeforeSpread: true,
                    warnOnDuplicates: true,
                },
            ],

            'react/jsx-no-constructed-context-values': 'warn',
            'react/no-deprecated': 'error',
            'react/no-find-dom-node': 'error',

            'react/function-component-definition': [
                'warn',
                {
                    namedComponents: 'function-declaration',
                    unnamedComponents: ['function-expression', 'arrow-function'],
                },
            ],

            'react/jsx-boolean-value': ['error', 'never'],

            'react/self-closing-comp': [
                'error',
                {
                    component: true,
                    html: true,
                },
            ],

            '@typescript-eslint/array-type': [
                'warn',
                {
                    default: 'array-simple',
                },
            ],

            '@typescript-eslint/consistent-type-assertions': [
                'warn',
                {
                    assertionStyle: 'as',
                },
            ],

            '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],

            '@typescript-eslint/consistent-type-imports': [
                'warn',
                {
                    prefer: 'type-imports',
                    fixStyle: 'inline-type-imports',
                },
            ],

            '@typescript-eslint/await-thenable': 'warn',
            'no-return-await': 'error',
            '@typescript-eslint/dot-notation': 'warn',
            '@typescript-eslint/no-array-constructor': 'warn',
            '@typescript-eslint/no-base-to-string': 'error',
            '@typescript-eslint/no-confusing-non-null-assertion': 'error',
            '@typescript-eslint/no-duplicate-enum-values': 'error',
            '@typescript-eslint/no-extra-non-null-assertion': 'warn',
            '@typescript-eslint/no-for-in-array': 'warn',
            '@typescript-eslint/no-implied-eval': 'error',
            '@typescript-eslint/no-inferrable-types': [
                'error',
                {
                    ignoreParameters: false,
                },
            ],
            '@typescript-eslint/no-loop-func': 'warn',
            '@typescript-eslint/no-loss-of-precision': 'error',
            '@typescript-eslint/no-meaningless-void-operator': 'warn',
            '@typescript-eslint/no-mixed-enums': 'error',
            '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'warn',
            '@typescript-eslint/no-this-alias': 'warn',
            '@typescript-eslint/no-unnecessary-qualifier': 'warn',
            '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
            '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
            '@typescript-eslint/no-unsafe-declaration-merging': 'error',
            '@typescript-eslint/prefer-as-const': 'warn',
            '@typescript-eslint/prefer-enum-initializers': 'warn',
            '@typescript-eslint/prefer-for-of': 'warn',
            '@typescript-eslint/prefer-includes': 'warn',
            '@typescript-eslint/prefer-literal-enum-member': 'error',
            '@typescript-eslint/prefer-optional-chain': 'warn',
            '@typescript-eslint/prefer-reduce-type-parameter': 'warn',
            '@typescript-eslint/prefer-return-this-type': 'error',
            '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
            '@typescript-eslint/require-array-sort-compare': 'error',
            '@typescript-eslint/no-misused-new': 'error',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            'import/first': 'error',
            'import/newline-after-import': 'error',
            'import/no-duplicates': 'error',

            // Architectural import boundaries (see importArchitecturalLayerZones above). Warn until legacy edges are removed.
            'import/no-restricted-paths': [
                'warn',
                {
                    zones: importArchitecturalLayerZones,
                },
            ],

            'no-relative-import-paths/no-relative-import-paths': [
                'warn',
                {
                    prefix: '@',
                    rootDir: 'apps/web/src',
                },
            ],

            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': [
                'warn',
                {
                    additionalHooks: '(useAsync|useAsyncFn)\\b',
                },
            ],

            // Next.js core-web-vitals rules
            ...nextPlugin.configs['core-web-vitals'].rules,

            // Tailwind CSS rules
            'tailwindcss/no-custom-classname': 'warn',
            'tailwindcss/enforces-shorthand': 'warn',
            'tailwindcss/enforces-negative-arbitrary-values': 'warn',
            'tailwindcss/migration-from-tailwind-2': 'warn',
            'tailwindcss/no-contradicting-classname': 'error',
            'tailwindcss/no-unnecessary-arbitrary-value': 'warn',
            'tailwindcss/no-arbitrary-value': 'off',
        },
    },
]);
