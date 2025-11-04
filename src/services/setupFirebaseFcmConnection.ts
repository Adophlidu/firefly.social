import { getToken } from 'firebase/messaging';

import { firebaseClient } from '@/configs/firebaseClient.js';
import { env } from '@/constants/env.js';
import { NOTIFICATION_PERMISSION_KEY } from '@/constants/index.js';
import { enqueuePermissionMessage } from '@/helpers/enqueuePermissionMessage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { uploadNotificationSubscription } from '@/providers/firefly/endpoints/uploadNotificationSubscription.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

interface Options {
    showUi?: boolean;
    force?: boolean;
}
const ONE_DAY = 1000 * 60 * 60 * 24;

async function askNotificationPermission(options?: Options): Promise<{
    granted: boolean;
    rejected?: boolean;
    showAlert?: boolean;
}> {
    try {
        if (!window || !('Notification' in window)) return { granted: false };
        if (Notification.permission === 'granted') return { granted: true };
        if (Notification.permission === 'denied') {
            return { granted: false, rejected: true, showAlert: true };
        }
        if (options?.showUi) {
            const lastTime = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
            if (lastTime && !Number.isNaN(lastTime) && Date.now() - Number(lastTime) < ONE_DAY && !options.force)
                return { granted: false };

            return { granted: false, showAlert: true };
        }

        const permission = await Notification.requestPermission();
        return { granted: permission === 'granted' };
    } catch {
        return { granted: false };
    }
}

export async function setupFirebaseFcmConnection(
    options: Options = {
        showUi: true,
        force: false,
    },
) {
    if (firebaseClient.initialized) return;

    const fireflySession = getSessionFromStorage(SessionType.Firefly);
    if (!fireflySession) return;

    const permission = await askNotificationPermission(options);
    if (permission.showAlert) {
        enqueuePermissionMessage(permission.rejected ?? false, () => {
            setupFirebaseFcmConnection({ showUi: false });
        });
    }
    if (!permission.granted) return;

    await runInSafeAsync(async () => {
        firebaseClient.init();
        const token = await getToken(firebaseClient.firebaseFcm, {
            vapidKey: env.external.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        if (!token) return;

        await uploadNotificationSubscription(token, '');
    });
}
