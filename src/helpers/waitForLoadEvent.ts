import { bom } from '@/helpers/bom.js';

export function waitForLoadEvent(): Promise<void> {
    if (!bom.document) return Promise.resolve();

    return new Promise((resolve) => {
        if (bom.document?.readyState === 'complete') {
            resolve();
        } else {
            bom.window?.addEventListener('load', () => resolve(), { once: true });
        }
    });
}
