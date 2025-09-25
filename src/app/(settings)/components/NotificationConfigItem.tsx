import { Checkbox } from '@headlessui/react';
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
            enqueueErrorMessage(<Trans>Failed to update notification settings</Trans>, { error });
            throw error;
        }
    }, [value, platform, pushType, unsupported]);
}

const notificationLabelMap: Record<string, ReactNode> = {
    Tips: <Trans>Tips</Trans>,
    Likes: <Trans>Likes</Trans>,
    Reports: <Trans>Reports</Trans>,
    Tokens: <Trans>Tokens</Trans>,
    'Hide small transactions(<$100)': <Trans>Hide small transactions(&lt;$100)</Trans>,
    Swaps: <Trans>Swaps</Trans>,
};
const notificationDescriptionMap: Record<string, ReactNode> = {
    'firefly.eth tipped you 100 USDC': <Trans>firefly.eth tipped you 100 USDC</Trans>,
    'firefly.eth liked your tips': <Trans>firefly.eth liked your tips</Trans>,
    'firefly.eth reposted your tips': <Trans>firefly.eth reposted your tips</Trans>,
    'Significant movements in token prices': <Trans>Significant movements in token prices</Trans>,
    'Block transactions under $100': <Trans>Block transactions under $100</Trans>,
    'firefly.eth liked your transaction': <Trans>firefly.eth liked your transaction</Trans>,
    'firefly.eth swapped 1850 USDC for 0.5 ETH': <Trans>firefly.eth swapped 1850 USDC for 0.5 ETH</Trans>,
};

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
                <p className="text-base font-bold text-main">
                    {typeof label === 'string' ? notificationLabelMap[label] || label : label}
                </p>
                <p className="mt-1 text-medium text-second">
                    {typeof description === 'string'
                        ? notificationDescriptionMap[description] || description
                        : description}
                </p>
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
                <p className="text-base font-bold text-main">
                    {typeof label === 'string' ? notificationLabelMap[label] || label : label}
                </p>
                <p className="mt-1 text-medium text-second">
                    {typeof description === 'string'
                        ? notificationDescriptionMap[description] || description
                        : description}
                </p>
            </div>
        </ClickableButton>
    );
}
