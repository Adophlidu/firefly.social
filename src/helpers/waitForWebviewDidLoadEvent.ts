import { delay } from '@masknet/kit';

import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedEvent } from '@/types/bridge.js';

export function waitForWebviewDidLoadEvent(timeout = 5_000): Promise<void> {
    return Promise.race([
        delay(timeout),
        new Promise<void>((resolve) => {
            fireflyBridgeProvider.on(SupportedEvent.WEBVIEW_DID_FINISH_LOAD, () => resolve());
        }),
    ]);
}
