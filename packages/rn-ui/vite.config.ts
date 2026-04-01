import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        react(),
        dts({
            rollupTypes: true,
            insertTypesEntry: true,
            include: ['src'],
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'RnUi',
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'react-native',
                'tamagui',
                '@tamagui/core',
                '@tamagui/config',
                'react-native-svg',
            ],
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
});
