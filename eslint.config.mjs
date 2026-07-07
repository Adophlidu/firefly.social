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
import { walletStackLazyBoundaryConfigs } from './rules/eslint-wallet-stack-lazy-boundary.mjs';

export default defineConfig([
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    },
    globalIgnores([
        '.github',
        '**/.next/**',
        '**/.output/**',
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
        'workers/**/types/**',
        '*.config.ts',
        '**/*.config.js',
        '**/*.config.cjs',
        '*.svg',
        'eslint.config.mjs',
        'eslint.shared.mjs',
        'vitest.config.ts',
        'setups',
        'rules',
        'e2e/**',
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
        // The root layout and not-found are the two files that gate ISR/CDN caching for the whole
        // site: pulling a dynamic request API (cookies/headers via next/headers) into either one
        // opts every route into per-request dynamic rendering. Keep them free of next/headers.
        files: ['apps/web/src/app/not-found.tsx', 'apps/web/src/app/layout.tsx'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: 'next/headers',
                            message:
                                'Dynamic request APIs in the root layout/not-found force every route to dynamic rendering and disable ISR site-wide.',
                        },
                        {
                            name: 'next/headers.js',
                            message:
                                'Dynamic request APIs in the root layout/not-found force every route to dynamic rendering and disable ISR site-wide.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['packages/**/*.{ts,tsx,js,jsx,mjs,cjs}', 'apps/web/src/services/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
        rules: {
            'no-console': 'off',
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

    // Wallet stack laziness — raw dynamic imports of configs/wagmiClient.ts / configs/appkit.ts
    // outside the loader funnel re-eagerize the wallet stack on every page
    // (see rules/eslint-wallet-stack-lazy-boundary.mjs for the Turbopack mechanism).
    ...walletStackLazyBoundaryConfigs,
]);
