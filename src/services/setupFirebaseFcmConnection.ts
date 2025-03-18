import { getToken } from 'firebase/messaging';

import { firebaseClient } from '@/configs/firebaseClient.js';
import { env } from '@/constants/env.js';
import { NOTIFICATION_PERMISSION_KEY } from '@/constants/index.js';
import { enqueuePermissionMessage } from '@/helpers/enqueueMessage.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

interface Options {
    showUi?: boolean;
}
const ONE_DAY = 1000 * 60 * 60 * 24;

async function askNotificationPermission(options?: Options) {
    try {
        if (!window || !('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') {
            enqueuePermissionMessage(true);
            return false;
        }
        if (options?.showUi) {
            const lastTime = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
            if (lastTime && !Number.isNaN(lastTime) && Date.now() - Number(lastTime) < ONE_DAY) return false;

            enqueuePermissionMessage(false);
            return false;
        }

        // TODO: display UI to ask for permission
        // @ts-ignore
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch {
        return false;
    }
}

export async function setupFirebaseFcmConnection(
    options: Options = {
        showUi: true,
    },
) {
    if (firebaseClient.initialized) return;

    const permission = await askNotificationPermission(options);
    if (!permission) return;

    await runInSafeAsync(async () => {
        firebaseClient.init();
        const token = await getToken(firebaseClient.firebaseFcm, {
            vapidKey: env.external.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        if (!token) return;

        await FireflyEndpointProvider.uploadNotificationSubscription(token, '');
    });
}
