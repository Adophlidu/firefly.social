import type { Safary } from '@/providers/types/Safary.js';

interface CustomWindow extends Window {
    opera: string;
    MSStream: object;

    VERCEL_IP_TIMEZONE: string;
    VERCEL_IP_CITY: string;
    VERCEL_IP_COUNTRY: string;
    VERCEL_IP_REGION: string;

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

    _firebaseFcm: unknown;

    safary: Safary | undefined;
}

export const bom = {
    get window() {
        return typeof self === 'undefined' ? null : (self as unknown as CustomWindow);
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
