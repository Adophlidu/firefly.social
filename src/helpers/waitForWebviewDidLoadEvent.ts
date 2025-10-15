import { timeout } from '@/helpers/timeout.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedEvent } from '@/types/bridge.js';

export function waitForWebviewDidLoadEvent(timer = 30_000): Promise<void> {
    return timeout(
        new Promise<void>((resolve) => {
            fireflyBridgeProvider.on(SupportedEvent.WEBVIEW_DID_FINISH_LOAD, () => resolve());
        }),
        timer,
    );
}
