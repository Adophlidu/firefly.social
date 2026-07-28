/**
 * react-native-web ships no type declarations in this version. Only the surface actually imported from 'react-native' is
 * declared here.
 */
declare module 'react-native-web' {
    export const StyleSheet: {
        getSheet(): { id: string; textContent: string };
    };
}
