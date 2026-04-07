import localforage from 'localforage';

interface AsyncStorage<Value> {
    getItem: (key: string, initialValue: Value) => PromiseLike<Value>;
    setItem: (key: string, newValue: Value) => PromiseLike<void>;
    removeItem: (key: string) => PromiseLike<void>;
}

export function createPersistStorage<T>(name: string) {
    if (typeof window === 'undefined') {
        const memoryStore = new Map<string, unknown>();
        const storage: AsyncStorage<T> = {
            async getItem(_name: string, initialValue: T) {
                return (memoryStore.get(name) as T | undefined) ?? initialValue;
            },
            async setItem(_name: string, value: unknown) {
                memoryStore.set(name, value);
            },
            async removeItem(_name: string) {
                memoryStore.delete(name);
            },
        };
        return storage;
    }

    const storageInstance = localforage.createInstance({
        name,
    });
    const storage: AsyncStorage<T> = {
        async getItem(_name: string, initialValue: T) {
            return (await storageInstance.getItem<T>(name)) ?? initialValue;
        },
        async setItem(_name: string, value: unknown) {
            await storageInstance.setItem(name, value);
        },
        async removeItem(_name: string) {
            await storageInstance.removeItem(name);
        },
    };
    return storage;
}
