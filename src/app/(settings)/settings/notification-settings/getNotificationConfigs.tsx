import { Trans } from '@lingui/react/macro';

import { NotificationPlatform, NotificationPushType, NotificationTitle } from '@/providers/types/Firefly.js';

export interface NotificationConfig {
    label: React.ReactNode;
    description: React.ReactNode;
    platform: NotificationPlatform;
    pushType: NotificationPushType;
    type: NotificationTitle;
    value: boolean;
    children?: NotificationConfig[];
}

export function getNotificationConfigs(): NotificationConfig[] {
    return [
        {
            label: <Trans>Push notifications</Trans>,
            description: <Trans>Turn on notifications to never miss important alerts.</Trans>,
            platform: NotificationPlatform.All,
            pushType: NotificationPushType.All,
            type: NotificationTitle.NotificationsMode,
            value: true,
        },
        {
            label: <Trans>Swaps</Trans>,
            description: <Trans>firefly.eth swapped 1850 USDC for 0.5 ETH</Trans>,
            platform: NotificationPlatform.OnChain,
            pushType: NotificationPushType.OnChainSwap,
            type: NotificationTitle.OnChain,
            value: true,
            children: [
                {
                    label: <Trans>Likes</Trans>,
                    description: <Trans>firefly.eth liked your transaction</Trans>,
                    platform: NotificationPlatform.OnChain,
                    pushType: NotificationPushType.OnChainLike,
                    type: NotificationTitle.OnChain,
                    value: true,
                },
                {
                    label: <Trans>Hide small transactions(&lt;$100)</Trans>,
                    description: <Trans>Block transactions under $100</Trans>,
                    platform: NotificationPlatform.OnChain,
                    pushType: NotificationPushType.HideSmallPrice,
                    type: NotificationTitle.OnChain,
                    value: true,
                },
            ],
        },
        {
            label: <Trans>Tips</Trans>,
            description: <Trans>firefly.eth tipped you 100 USDC</Trans>,
            platform: NotificationPlatform.Tips,
            pushType: NotificationPushType.OnChainTips,
            type: NotificationTitle.Tips,
            value: true,
        },
    ];
}
