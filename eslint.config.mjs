import nextPlugin from '@next/eslint-plugin-next';
import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import {
    sharedEslintPlugins,
    sharedEslintRulesWithoutRelativePaths,
    sharedReactTailwindSettings,
    tsParser,
} from './eslint.shared.mjs';
import { walletEnvsImportRestriction, webEnvsImportRestriction } from './rules/eslint-envs-app-boundaries.mjs';
import { importArchitecturalLayerZones } from './rules/eslint-import-architecture-zones.mjs';
import { packageBoundaryConfigs } from './rules/eslint-package-layer-boundaries.mjs';
import useClientNewline from './rules/eslint-plugin-use-client-newline.mjs';

export default defineConfig([
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    },
    globalIgnores([
        '.github',
        '**/.next/**',
        '**/.output/**',
        '**/.storybook/**',
        '**/.vercel/**',
        '**/next-env.d.ts',
        'apps/**/dist/**',
        'apps/**/build/**',
        'apps/**/prebuilt/**',
        'apps/**/public/**',
        'apps/**/setups/**',
        'apps/**/scripts/**',
        'packages/**/scripts/**',
        'apps/**/src/polyfills',
        'apps/**/src/locales/**',
        'packages/**/src/locales/**',
        'workers/**/dist/**',
        '*.config.ts',
        '**/*.config.js',
        '**/*.config.cjs',
        '*.svg',
        'eslint.config.mjs',
        'eslint.shared.mjs',
        'vitest.config.ts',
        'setups',
        'rules',
        'packages/tolgee/**',
        'packages/**/dist',
        'packages/**/node_modules',
    ]),
    {
        files: ['apps/web/src/libs/LoggerNative.ts', 'apps/wallet/src/lib/LoggerNative.ts'],
        rules: {
            'no-console': 'off',
        },
    },
    {
        files: ['apps/web/**/*.{ts,tsx,js,jsx,mjs,cjs}', 'packages/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
        plugins: {
            ...sharedEslintPlugins,
            '@next/next': nextPlugin,
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
            ...sharedReactTailwindSettings,
            tailwindcss: {
                ...sharedReactTailwindSettings.tailwindcss,
                config: 'apps/web/tailwind.config.cjs',
            },
        },
        rules: {
            ...sharedEslintRulesWithoutRelativePaths,
            'use-client-newline/require-newline-after-use-client': 'warn',

            // Architectural import boundaries (see rules/eslint-import-architecture-zones.mjs). Warn until legacy edges are removed.
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

            // Next.js core-web-vitals rules
            ...nextPlugin.configs['core-web-vitals'].rules,

            'no-restricted-imports': webEnvsImportRestriction,
        },
    },
    {
        files: ['packages/**/*.{ts,tsx,js,jsx,mjs,cjs}', 'apps/web/src/services/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
        rules: {
            'no-console': 'off',
        },
    },
    {
        // rn-ui owns an instance-scoped Lingui i18n (never touches the
        // @lingui/core global). The bare `t` macro from @lingui/core/macro
        // compiles to a global-i18n call, which would race with the
        // consumer app's own Lingui instance. Only `<Trans>` (and friends)
        // from @lingui/react/macro and `useLingui()` from @lingui/react
        // are safe inside rn-ui — they read the I18nContext that rn-ui's
        // Provider wraps its subtree with. See design doc P4 + premise
        // checks in dudu-feat-rn-ui-i18n-design-*.md.
        files: ['packages/rn-ui/src/**/*.{ts,tsx,js,jsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@lingui/core/macro',
                            importNames: ['t'],
                            message:
                                'rn-ui uses an instance-scoped i18n. Use <Trans> or <Plural> from @lingui/react/macro for JSX, or `useLingui().i18n._(...)` from @lingui/react for non-JSX. The bare `t` macro compiles to global-i18n calls and would race with the consumer app.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['apps/wallet/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
        plugins: {
            ...sharedEslintPlugins,
        },

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'script',

            parserOptions: {
                project: './apps/wallet/tsconfig.eslint.json',
                tsconfigRootDir: import.meta.dirname,
                warnOnUnsupportedTypeScriptVersion: false,
                allowAutomaticSingleRunInference: true,
            },
        },
        settings: {
            ...sharedReactTailwindSettings,
            tailwindcss: {
                ...sharedReactTailwindSettings.tailwindcss,
                config: 'apps/wallet/tailwind.config.cjs',
            },
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './apps/wallet/tsconfig.eslint.json',
                },
                node: true,
            },
        },
        rules: {
            ...sharedEslintRulesWithoutRelativePaths,
            'no-relative-import-paths/no-relative-import-paths': [
                'warn',
                {
                    prefix: '@',
                    rootDir: 'apps/wallet/src',
                },
            ],

            'no-restricted-imports': walletEnvsImportRestriction,
        },
    },

    // Cloudflare Workers — TypeScript-aware lint without React/Tailwind rules.
    {
        files: ['workers/**/*.ts'],
        plugins: {
            '@typescript-eslint': typescriptEslintEslintPlugin,
            import: importPlugin,
            'simple-import-sort': simpleImportSort,
            'unused-imports': unusedImports,
        },
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                project: true,
                warnOnUnsupportedTypeScriptVersion: false,
            },
        },
        rules: {
            'default-case-last': 'error',
            eqeqeq: 'error',
            'no-console': 'off',
            'no-constant-condition': 'warn',
            'no-debugger': 'warn',
            'no-duplicate-case': 'error',
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }],
            'no-restricted-imports': ['error'],
            'no-return-await': 'error',
            'no-self-compare': 'error',
            'no-unused-vars': 'off',
            'prefer-const': 'warn',
            'object-shorthand': 'warn',
            'unused-imports/no-unused-imports': 'error',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            'import/first': 'error',
            'import/newline-after-import': 'error',
            'import/no-duplicates': 'error',
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
            '@typescript-eslint/consistent-type-imports': [
                'warn',
                { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
            ],
            '@typescript-eslint/no-import-type-side-effects': 'error',
            '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
            '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
            '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: false }],
            '@typescript-eslint/prefer-optional-chain': 'warn',
            '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
        },
    },

    // Package boundary rules — one config per workspace package (see rules/eslint-package-layer-boundaries.mjs).
    // These override the baseline no-restricted-imports for each package's src directory.
    ...packageBoundaryConfigs,
]);
