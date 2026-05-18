import { resolve } from 'node:path';

import { lingui } from '@lingui/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';
import dts from 'vite-plugin-dts';

const srcDir = resolve(__dirname, 'src');

/**
 * Dependencies expected from the host app (see package.json peerDependencies).
 * Keeps dist output small; Metro/Vite dedupe a single copy at runtime.
 */
function isExternal(id: string): boolean {
    if (id === 'react' || id === 'react/jsx-runtime' || id === 'react/jsx-dev-runtime') {
        return true;
    }
    if (id === 'react-dom') {
        return true;
    }
    if (id === 'react-native' || id.startsWith('react-native/')) {
        return true;
    }
    if (id === 'react-native-svg') {
        return true;
    }
    if (id === 'react-native-webview') {
        return true;
    }
    if (id === 'tamagui' || id.startsWith('tamagui/')) {
        return true;
    }
    if (id.startsWith('@tamagui/')) {
        return true;
    }
    if (id.startsWith('@tanstack/react-query')) {
        return true;
    }
    if (id === 'jotai' || id.startsWith('jotai/')) {
        return true;
    }
    if (id === 'bignumber.js') {
        return true;
    }
    if (id === 'urlcat') {
        return true;
    }
    if (id.startsWith('@nktkas/')) {
        return true;
    }
    if (id === '@dimensiondev/utils') {
        return true;
    }
    if (id === 'lucide-react-native' || id.startsWith('lucide-react-native/')) {
        return true;
    }
    if (id === '@lingui/core' || id.startsWith('@lingui/core/')) {
        return true;
    }
    if (id === '@lingui/react' || id.startsWith('@lingui/react/')) {
        return true;
    }
    return false;
}

export default defineConfig(async (): Promise<UserConfig> => {
    const plugins: PluginOption[] = [
        react({
            babel: {
                plugins: ['@lingui/babel-plugin-lingui-macro'],
            },
        }),
        lingui(),
        dts({
            rollupTypes: true,
            insertTypesEntry: true,
            include: ['src'],
            entryRoot: srcDir,
        }),
    ];
    if (process.env.ANALYZE === '1') {
        const { visualizer } = await import('rollup-plugin-visualizer');
        plugins.push(
            visualizer({
                filename: resolve(__dirname, 'dist/stats.html'),
                gzipSize: true,
                brotliSize: true,
                open: false,
            }) as PluginOption,
        );
    }
    return {
        plugins,
        resolve: {
            alias: {
                '@': srcDir,
            },
        },
        build: {
            lib: {
                entry: {
                    index: resolve(__dirname, 'src/index.ts'),
                    perps: resolve(__dirname, 'src/entries/perps.ts'),
                    provider: resolve(__dirname, 'src/entries/provider.ts'),
                },
                name: 'RnUi',
                formats: ['es', 'cjs'],
                fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
            },
            rollupOptions: {
                external: isExternal,
                output: {
                    globals: {
                        react: 'React',
                        'react-dom': 'ReactDOM',
                        'react-native': 'ReactNative',
                        tamagui: 'Tamagui',
                    },
                },
            },
        },
    };
});
