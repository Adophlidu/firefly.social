import { SessionType } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { runInSafeAsync } from '@dimensiondev/utils';
import { getToken } from 'firebase/messaging';

import { firebaseClient } from '@/configs/firebaseClient.js';
import { NOTIFICATION_PERMISSION_KEY } from '@/constants/static.js';
import { enqueuePermissionMessage } from '@/helpers/enqueuePermissionMessage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { uploadNotificationSubscription } from '@/providers/firefly/endpoint/uploadNotificationSubscription.js';

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

        const lastTime = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
        const hideAlert =
            !!lastTime &&
            (lastTime === `${Infinity}` || (!Number.isNaN(+lastTime) && Date.now() - Number(lastTime) < ONE_DAY));

        if (Notification.permission === 'denied') {
            return { granted: false, rejected: true, showAlert: !hideAlert };
        }
        if (options?.showUi) {
            return { granted: false, showAlert: !hideAlert };
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
        await firebaseClient.init();
        const token = await getToken(firebaseClient.firebaseFcm, {
            vapidKey: envs.external.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        if (!token) return;

        await uploadNotificationSubscription(token, '');
    });
}
