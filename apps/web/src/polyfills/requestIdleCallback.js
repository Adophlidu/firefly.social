try {
    if (typeof window !== 'undefined' && !window.requestIdleCallback) {
        window.requestIdleCallback = (cb, options) => {
            const start = Date.now();
            const timer = setTimeout(() => {
                cb({
                    didTimeout: false,
                    timeRemaining() {
                        return Math.max(0, 50 - (Date.now() - start));
                    },
                });
            }, options?.timeout ?? 1);
            return timer;
        };
        window.cancelIdleCallback = clearTimeout;
    }
} catch {}
