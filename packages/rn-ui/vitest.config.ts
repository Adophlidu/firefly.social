import { fileURLToPath } from 'node:url';

import { lingui } from '@lingui/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * rn-ui vitest setup is **node-only** by design (T-OV3a in the eng review).
 *
 * Why node and not jsdom: rn-ui components `import { View, Text } from 'react-native'`,
 * which is the native runtime (Fabric/JSI) and crashes under jsdom. Making
 * rendering tests work in rn-ui would require setting up react-native-web
 * aliasing + Tamagui-under-RNW, which the consuming apps/wallet already
 * has working. So:
 *
 *   - Pure-function tests (this config): `setupRnUiI18n` returns, locale
 *     fallback, dev-mode warn, etc. — anything that doesn't import RN.
 *   - Rendering tests: live in apps/wallet/test/, reusing wallet's RNW
 *     alias + Tamagui shell.
 */
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: ['@lingui/babel-plugin-lingui-macro'],
            },
        }),
        lingui(),
    ],
    test: {
        environment: 'node',
        include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
