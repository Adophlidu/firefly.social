import { nativeBridgeProvider, SupportedEvent } from '@firefly/native-bridge';
import { delay } from '@firefly/utils';

export async function waitForWebviewDidLoadEvent(duration = 5_000): Promise<void> {
    await Promise.race([
        new Promise<void>((resolve) => {
            nativeBridgeProvider.on(SupportedEvent.WEBVIEW_DID_FINISH_LOAD, () => resolve());
        }),
        delay(duration),
    ]);
}
