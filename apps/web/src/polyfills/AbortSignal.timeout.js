try {
    if (typeof window !== 'undefined' && 'AbortSignal' in window && !AbortSignal.timeout) {
        // https://dom.spec.whatwg.org/#dom-abortsignal-timeout
        AbortSignal.timeout = function (milliseconds) {
            const controller = new AbortController();
            const signal = controller.signal;
            const signalTimer = setTimeout(() => {
                controller.abort(new DOMException('Signal timed out.', 'TimeoutError'));
            }, milliseconds);
            signal.addEventListener('abort', () => {
                clearTimeout(signalTimer);
            });
            return signal;
        };
    }
} catch {}
