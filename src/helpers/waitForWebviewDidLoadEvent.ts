import { delay } from '@/helpers/delay.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedEvent } from '@/types/bridge.js';

export async function waitForWebviewDidLoadEvent(duration = 5_000): Promise<void> {
    await Promise.race([
        new Promise<void>((resolve) => {
            fireflyBridgeProvider.on(SupportedEvent.WEBVIEW_DID_FINISH_LOAD, () => resolve());
        }),
        delay(duration),
    ]);
}
