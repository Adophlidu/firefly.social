import { Switch } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { produce } from 'immer';
import { useAsyncFn } from 'react-use';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { queryClient } from '@/configs/queryClient.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type {
    NotificationPlatform,
    NotificationPushSwitchResponse,
    NotificationPushType,
    NotificationTitle,
} from '@/providers/types/Firefly.js';

export interface NotificationConfigItemProps {
    label: React.ReactNode;
    description: React.ReactNode;
    value: boolean;
    platform: NotificationPlatform;
    pushType: NotificationPushType;
    type: NotificationTitle;
    unsupported?: boolean;
}

function updateQueryData(
    title: NotificationTitle,
    platform: NotificationPlatform,
    pushType: NotificationPushType,
    state: boolean,
) {
    queryClient.setQueryData<Required<NotificationPushSwitchResponse>['data']['list']>(
        ['notification-settings', 'config'],
        (oldData) => {
            if (!oldData) return;
            return produce(oldData, (draft) => {
                const allStatus = Object.values(draft || {}).flatMap((x) => x.list);
                const item = allStatus.find((x) => x.platform === platform && x.push_type === pushType);
                if (!item) return;
                item.state = state;
            });
        },
    );
}

export function NotificationConfigItem({
    label,
    description,
    value,
    platform,
    pushType,
    unsupported,
    type,
}: NotificationConfigItemProps) {
    const [{ loading }, onSwitch] = useAsyncFn(async () => {
        try {
            if (unsupported) return;
            await FireflySocialMediaProvider.setNotificationPushSwitch({
                list: [
                    {
                        platform,
                        push_type: pushType,
                        state: !value,
                    },
                ],
            });
            updateQueryData(type, platform, pushType, !value);
        } catch (error) {
            enqueueErrorMessage(t`Failed to update notification settings`, { error });
            throw error;
        }
    }, [value, platform, pushType, unsupported, type]);

    return (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-line px-3 py-2">
            <div className="min-w-0 flex-1 truncate">
                <p className="text-base font-bold text-main">{label}</p>
                <p className="mt-1 text-medium text-lightSecond">{description}</p>
            </div>
            <Tooltip content={unsupported ? t`Seems like this feature is not supported!` : ''} disabled={!unsupported}>
                <Switch
                    disabled={loading}
                    checked={value}
                    onChange={onSwitch}
                    className={classNames(
                        'group inline-flex h-[22px] w-11 items-center rounded-full bg-second transition data-[checked]:bg-lightHighlight dark:bg-bg data-[checked]:dark:bg-lightHighlight',
                        unsupported ? 'opacity-50' : '',
                    )}
                >
                    <span className="flex size-4 translate-x-1 items-center justify-center rounded-full bg-white transition group-data-[checked]:translate-x-6">
                        {loading ? <LoadingIcon className="text-darkBottom" size={12} /> : null}
                    </span>
                </Switch>
            </Tooltip>
        </div>
    );
}
