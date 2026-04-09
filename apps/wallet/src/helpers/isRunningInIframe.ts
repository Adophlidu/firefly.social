import { bom } from '@dimensiondev/utils';

export function isRunningInIframe(): boolean {
    const w = bom.window;
    return w !== null && w !== w.top;
}
