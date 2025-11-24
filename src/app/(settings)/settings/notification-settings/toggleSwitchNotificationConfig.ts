import { deleteToken } from 'firebase/messaging';

import { firebaseClient } from '@/configs/firebaseClient.js';
import { queryClient } from '@/configs/queryClient.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setNotificationPushSwitch } from '@/providers/firefly/endpoint/setNotificationPushSwitch.js';
import { type NotificationConfig, NotificationPlatform } from '@/providers/types/Firefly.js';
import { setupFirebaseFcmConnection } from '@/services/setupFirebaseFcmConnection.js';

async function revokeFirebaseToken() {
    if (!firebaseClient.initialized) return;
    await deleteToken(firebaseClient.firebaseFcm);
}

export async function toggleSwitchNotificationConfig({
    platform,
    pushType,
    value,
}: Omit<NotificationConfig, 'label' | 'description'>) {
    const targetValue = !value;
    const configsNeedToUpdate = [
        {
            platform,
            push_type: pushType,
            state: targetValue,
        },
    ];

    await setNotificationPushSwitch({
        list: configsNeedToUpdate,
    });

    queryClient.refetchQueries({
        queryKey: ['notification-settings', 'config'],
    });

    const isGlobalSwitch = platform === NotificationPlatform.All;
    // delete firebase token if user disable global switch
    if (isGlobalSwitch && !targetValue) {
        runInSafeAsync(revokeFirebaseToken);
    }

    // setup firebase connection if user enable global switch
    if (isGlobalSwitch && targetValue) {
        runInSafeAsync(async () => {
            await setupFirebaseFcmConnection({ force: true, showUi: true });
        });
    }
}
