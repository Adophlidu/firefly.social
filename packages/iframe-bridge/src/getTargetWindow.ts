import { bom, defer, timeout } from '@dimensiondev/utils';

/**
 * Check if a window is fully loaded by waiting for the load event
 * @param window The window to check
 * @returns Promise that resolves when the window is loaded, or rejects if timeout
 */
function checkWindowLoaded(window: Window): Promise<Window> {
    // If the window is already loaded, resolve immediately
    if (window.document.readyState === 'complete') {
        return Promise.resolve(window);
    }

    // Apply timeout to the load promise
    const [promise, resolve] = defer<Window>();

    const handleLoad = () => {
        resolve(window);
    };

    // Use { once: true } to automatically remove listener after firing
    window.addEventListener('load', handleLoad, { once: true });

    return timeout(promise, 30 * 1000, 'Window load timeout').finally(() => {
        // Cleanup for timeout cases where the event never fired
        window.removeEventListener('load', handleLoad);
    });
}

function isIframe(): boolean {
    try {
        return bom.window !== null && bom.window !== bom.window.top;
    } catch {
        return true;
    }
}

export async function getTargetWindow(): Promise<Window | null> {
    if (!bom.window) {
        console.warn(`[iframe-bridge] Window object is not available.`);
        return null;
    }

    let targetWindow: Window | null = null;

    if (isIframe()) {
        targetWindow = bom.window.parent;
    } else {
        // If we're the parent, we need to find the iframe window
        // This is a simplified approach - in practice you might need to track specific iframe references
        if (!bom.document) {
            console.warn(`[iframe-bridge] Document object is not available.`);
            return null;
        }

        const iframes = bom.document.querySelectorAll('iframe');
        if (iframes.length > 0) {
            targetWindow = iframes[0].contentWindow!;
        } else {
            console.warn(`[iframe-bridge] No iframe found in the document.`);
            return null;
        }
    }

    if (!targetWindow) return null;

    try {
        // Wait for the target window to be fully loaded
        return await checkWindowLoaded(targetWindow);
    } catch (error) {
        console.warn(`[iframe-bridge] Failed to wait for window load:`, error);
        return null;
    }
}
