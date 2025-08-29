import { Checkbox } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type ReactNode } from 'react';
import { useAsyncFn } from 'react-use';

import { toggleSwitchNotificationConfig } from '@/app/(settings)/settings/notification-settings/toggleSwitchNotificationConfig.js';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Switch } from '@/components/Switch/index.js';
import { Tooltip } from '@/components/Tooltip.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import type { NotificationPlatform, NotificationPushType } from '@/providers/types/Firefly.js';

interface NotificationConfigItemProps {
    label: ReactNode;
    description: ReactNode;
    value: boolean;
    platform: NotificationPlatform;
    pushType: NotificationPushType;
    unsupported?: boolean;
    disabled?: boolean;
    className?: string;
}

function useToggleNotificationConfig({
    value,
    platform,
    pushType,
    unsupported,
}: Omit<NotificationConfigItemProps, 'label' | 'description'>) {
    return useAsyncFn(async () => {
        try {
            if (unsupported) return;
            await toggleSwitchNotificationConfig({
                value,
                platform,
                pushType,
            });
        } catch (error) {
            enqueueErrorMessage(t`Failed to update notification settings`, { error });
            throw error;
        }
    }, [value, platform, pushType, unsupported]);
}

export function NotificationConfigItem({
    label,
    description,
    disabled,
    className,
    ...rest
}: NotificationConfigItemProps) {
    const [{ loading }, onSwitch] = useToggleNotificationConfig(rest);

    return (
        <div
            className={classNames(
                'flex items-center gap-2',
                className,
                disabled ? 'cursor-not-allowed opacity-50' : '',
            )}
        >
            <div className="min-w-0 flex-1 truncate">
                <p className="text-base font-bold text-main">{label}</p>
                <p className="mt-1 text-medium text-second">{description}</p>
            </div>
            <Tooltip
                content={rest.unsupported ? <Trans>Seems like this feature is not supported!</Trans> : null}
                disabled={!rest.unsupported}
            >
                <Switch
                    disabled={loading || disabled}
                    loading={loading}
                    checked={rest.value}
                    onChange={onSwitch}
                    className={classNames(rest.unsupported ? 'opacity-50' : '')}
                />
            </Tooltip>
        </div>
    );
}

export function NotificationChildConfigItem({ label, description, disabled, ...rest }: NotificationConfigItemProps) {
    const [{ loading }, onSwitch] = useToggleNotificationConfig(rest);

    return (
        <ClickableButton
            disabled={loading || disabled}
            onClick={onSwitch}
            className="flex w-full items-start gap-2 border-b border-line py-2 text-left last:border-none last:pb-0"
        >
            <Tooltip
                content={rest.unsupported ? <Trans>Seems like this feature is not supported!</Trans> : null}
                disabled={!rest.unsupported}
            >
                <Checkbox aria-readonly checked={rest.value} className="mt-[3px]">
                    {loading ? <LoadingIcon size={20} /> : <CircleCheckboxIcon size={20} checked={rest.value} />}
                </Checkbox>
            </Tooltip>
            <div className="min-w-0 flex-1 truncate">
                <p className="text-base font-bold text-main">{label}</p>
                <p className="mt-1 text-medium text-second">{description}</p>
            </div>
        </ClickableButton>
    );
}
