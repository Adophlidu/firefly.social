import { deleteToken } from 'firebase/messaging';
import { produce } from 'immer';
import { omit } from 'lodash-es';

import {
    getNotificationConfigs,
    type NotificationConfig,
} from '@/app/(settings)/settings/notification-settings/getNotificationConfigs.js';
import { firebaseClient } from '@/configs/firebaseClient.js';
import { queryClient } from '@/configs/queryClient.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import {
    NotificationPlatform,
    type NotificationPushSwitchResponse,
    type NotificationPushType,
} from '@/providers/types/Firefly.js';
import { setupFirebaseFcmConnection } from '@/services/setupFirebaseFcmConnection.js';

function updateQueryData(platform: NotificationPlatform, pushType: NotificationPushType, state: boolean) {
    queryClient.setQueryData<Required<NotificationPushSwitchResponse>['data']>(
        ['notification-settings', 'config'],
        (oldData) => {
            if (!oldData) return;
            return produce(oldData, (draft) => {
                if (platform === NotificationPlatform.All) {
                    draft.push_switch = state;
                    return;
                }
                const allStatus = Object.values(draft?.list || {}).flatMap((x) => x.list);
                const item = allStatus.find((x) => x.platform === platform && x.push_type === pushType);
                if (!item) return;
                item.state = state;
            });
        },
    );
}

async function revokeFirebaseToken() {
    if (!firebaseClient.initialized) return;
    await deleteToken(firebaseClient.firebaseFcm);
}

export async function toggleSwitchNotificationConfig({
    platform,
    pushType,
    value,
    type,
}: Omit<NotificationConfig, 'label' | 'description'>) {
    const targetValue = !value;
    const configsNeedToUpdate = [
        {
            platform,
            push_type: pushType,
            state: targetValue,
            type,
        },
    ];
    const children = getNotificationConfigs().find(
        (config) => config.platform === platform && config.pushType === pushType,
    )?.children;
    const isGlobalSwitch = platform === NotificationPlatform.All;
    if (!targetValue && children?.length) {
        children.forEach((child) => {
            configsNeedToUpdate.push({
                platform: child.platform,
                push_type: child.pushType,
                state: targetValue,
                type: child.type,
            });
        });
    }
    if (!targetValue && isGlobalSwitch) {
        getNotificationConfigs().forEach((config) => {
            if (config.platform === NotificationPlatform.All) return;
            configsNeedToUpdate.push({
                platform: config.platform,
                push_type: config.pushType,
                state: targetValue,
                type: config.type,
            });
        });
    }

    await FireflySocialMediaProvider.setNotificationPushSwitch({
        list: configsNeedToUpdate.map((config) => omit(config, 'type')),
    });
    configsNeedToUpdate.forEach((config) => {
        updateQueryData(config.platform, config.push_type, config.state);
    });

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
