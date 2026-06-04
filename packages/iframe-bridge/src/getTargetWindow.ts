import { bom, defer, timeout } from '@dimensiondev/utils';

/**
 * Check if a window is fully loaded by waiting for the load event
 * @param window The window to check
 * @returns Promise that resolves when the window is loaded, or rejects if timeout
 */
function checkWindowLoaded(window: Window): Promise<Window> {
    // Try to check if the window is already loaded
    // This may fail for cross-origin windows due to security restrictions
    try {
        if (window.document.readyState === 'complete') {
            return Promise.resolve(window);
        }
    } catch (error) {
        // Cross-origin access error - we can't check the document state
        // For cross-origin windows, we can't reliably check if they're loaded
        // so we just resolve immediately as postMessage works regardless
        console.warn('[iframe-bridge] Cannot check window load state (likely cross-origin):', error);
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

/**
 * Check if a window is same-origin by trying to access its document
 */
function isSameOrigin(win: Window): boolean {
    try {
        // Try to access document - this will throw for cross-origin windows
        void win.document;
        return true;
    } catch {
        return false;
    }
}

export interface GetTargetWindowOptions {
    /** When the host page targets a specific child iframe, pass its element id. */
    iframeId?: string;
}

export async function getTargetWindow(options?: GetTargetWindowOptions): Promise<Window | null> {
    if (!bom.window) {
        console.warn(`[iframe-bridge] Window object is not available.`);
        return null;
    }

    let targetWindow: Window | null = null;

    if (isIframe()) {
        targetWindow = bom.window.parent;
    } else {
        // If we're the parent, we need to find the iframe window
        if (!bom.document) {
            console.warn(`[iframe-bridge] Document object is not available.`);
            return null;
        }

        if (options?.iframeId) {
            const iframe = bom.document.getElementById(options.iframeId);
            if (iframe instanceof HTMLIFrameElement && iframe.contentWindow && isSameOrigin(iframe.contentWindow)) {
                targetWindow = iframe.contentWindow;
            } else {
                console.warn(`[iframe-bridge] Same-origin iframe not found for id: ${options.iframeId}`);
                return null;
            }
        } else {
            // Find the first same-origin iframe
            const iframes = bom.document.querySelectorAll('iframe');
            for (const iframe of iframes) {
                if (iframe.contentWindow && isSameOrigin(iframe.contentWindow)) {
                    targetWindow = iframe.contentWindow;
                    break;
                }
            }

            if (!targetWindow) {
                console.warn(`[iframe-bridge] No same-origin iframe found in the document.`);
                return null;
            }
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
