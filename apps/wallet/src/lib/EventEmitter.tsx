type Listener = (...args: any[]) => void;

export class BrowserEventEmitter {
    private listeners: Record<string, Listener[]> = {};

    on(event: string, listener: Listener) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(listener);
        return this;
    }

    removeListener(event: string, listener: Listener) {
        if (!this.listeners[event]) return this;
        this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
        return this;
    }

    emit(event: string, ...args: any[]) {
        if (!this.listeners[event]) return false;
        this.listeners[event].forEach((listener) => listener(...args));
        return true;
    }
}
