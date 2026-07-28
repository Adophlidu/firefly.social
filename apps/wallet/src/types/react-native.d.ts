/**
 * The wallet aliases `react-native` to react-native-web at build time (see
 * vite.config.ts); this version of react-native-web ships no type
 * declarations. Only the surface actually imported from 'react-native' is
 * declared here.
 */
declare module 'react-native' {
    export const StyleSheet: {
        getSheet(): { id: string; textContent: string };
    };
}
