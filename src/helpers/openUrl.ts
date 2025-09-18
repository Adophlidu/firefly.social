import urlcat from 'urlcat';

import { openWindow } from '@/helpers/openWindow.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

export async function openUrl(urlOrPathname: string) {
    if (!fireflyBridgeProvider.supported) {
        openWindow(urlOrPathname);
        return;
    }

    await fireflyBridgeProvider.request(SupportedMethod.OPEN_URL, {
        url: !urlOrPathname.startsWith('https') ? urlcat(location.origin, urlOrPathname) : urlOrPathname,
    });
}
