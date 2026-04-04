import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';
import urlcat from 'urlcat';

import { openWindow } from '@/helpers/openWindow.js';

export async function openUrl(urlOrPathname: string) {
    if (!nativeBridgeProvider.supported) {
        openWindow(urlOrPathname);
        return;
    }

    await nativeBridgeProvider.request(SupportedMethod.OPEN_URL, {
        url: !urlOrPathname.startsWith('https') ? urlcat(location.origin, urlOrPathname) : urlOrPathname,
    });
}
