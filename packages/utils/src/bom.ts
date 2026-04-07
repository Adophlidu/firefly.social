interface CustomWindow extends Window {
    opera: string;
    MSStream: object;

    webkit?: {
        messageHandlers?: {
            [key: string]: {};
            callNativeMethod: {
                postMessage: (message: { method: string; tag: string; params: string }) => void;
            };
        };
    };
    FireflyApi?: {
        callNativeMethod: (method: string, id: string, params: string) => void;
    };
}

/**
 * Browser Object Model (BOM) utilities for safe access to browser APIs
 * Provides safe access to window, document, location, navigator, and localStorage
 * Returns null when running in non-browser environments (like SSR)
 */
export const bom = {
    get window() {
        return typeof window === 'undefined' ? null : (window as unknown as CustomWindow);
    },

    get document() {
        return typeof document === 'undefined' ? null : document;
    },

    get location() {
        return typeof location === 'undefined' ? null : location;
    },

    get navigator() {
        return typeof navigator === 'undefined' ? null : navigator;
    },

    get localStorage() {
        return typeof localStorage === 'undefined' ? null : localStorage;
    },
};
