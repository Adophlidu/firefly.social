// Shim for @react-native-async-storage/async-storage
// Uses localStorage in the browser

const AsyncStorage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            if (typeof window === 'undefined') return null;
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            if (typeof window === 'undefined') return;
            window.localStorage.setItem(key, value);
        } catch {
            // ignore
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            if (typeof window === 'undefined') return;
            window.localStorage.removeItem(key);
        } catch {
            // ignore
        }
    },
    clear: async (): Promise<void> => {
        try {
            if (typeof window === 'undefined') return;
            window.localStorage.clear();
        } catch {
            // ignore
        }
    },
    getAllKeys: async (): Promise<string[]> => {
        try {
            if (typeof window === 'undefined') return [];
            return Object.keys(window.localStorage);
        } catch {
            return [];
        }
    },
    multiGet: async (keys: string[]): Promise<ReadonlyArray<[string, string | null]>> => {
        try {
            if (typeof window === 'undefined') return keys.map((k) => [k, null]);
            return keys.map((k) => [k, window.localStorage.getItem(k)]);
        } catch {
            return keys.map((k) => [k, null]);
        }
    },
    multiSet: async (keyValuePairs: Array<[string, string]>): Promise<void> => {
        try {
            if (typeof window === 'undefined') return;

            for (const [key, value] of keyValuePairs) {
                window.localStorage.setItem(key, value);
            }
        } catch {
            // ignore
        }
    },
    multiRemove: async (keys: string[]): Promise<void> => {
        try {
            if (typeof window === 'undefined') return;

            for (const key of keys) {
                window.localStorage.removeItem(key);
            }
        } catch {
            // ignore
        }
    },
};

export default AsyncStorage;
