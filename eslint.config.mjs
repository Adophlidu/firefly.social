import nextPlugin from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import {
    sharedEslintPlugins,
    sharedEslintRulesWithoutRelativePaths,
    sharedReactTailwindSettings,
    tsParser,
} from './eslint.shared.mjs';
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
        'apps/**/src/polyfills',
        'apps/**/src/locales/**',
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
        },
    },

    // Package boundary rules — one config per workspace package (see rules/eslint-package-layer-boundaries.mjs).
    // These override the baseline no-restricted-imports for each package's src directory.
    ...packageBoundaryConfigs,
]);
