import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import type { ReactNode } from 'react';

import {
    type NotificationConfig,
    type NotificationConfigsResponse,
    NotificationPlatform,
    NotificationPushType,
    NotificationTitle,
} from '@/providers/types/Firefly.js';

type NotificationData = Required<NotificationConfigsResponse>['data'];
type ConfigItem = NotificationData['list'][number]['list'][number];

function getDescription(config: ConfigItem) {
    const defaultDescription: Partial<Record<NotificationPushType, ReactNode>> = {
        [NotificationPushType.OnChainSwap]: <Trans>firefly.eth swapped 1850 USDC for 0.5 ETH</Trans>,
        [NotificationPushType.HideSmallPrice]: <Trans>Block transactions under $100</Trans>,
        [NotificationPushType.OnChainLike]: <Trans>firefly.eth liked your transaction</Trans>,
        [NotificationPushType.OnChainTips]: <Trans>firefly.eth tipped you 100 USDC</Trans>,
    };

    if (config.description) {
        return config.description;
    }

    if (config.push_type in defaultDescription) {
        return defaultDescription[config.push_type];
    }

    return config.title;
}

function isSameConfig(config: ConfigItem, otherConfig: ConfigItem) {
    return config.platform === otherConfig.platform && config.push_type === otherConfig.push_type;
}

export function formatNotificationConfigs(data: NotificationData): NotificationConfig[] {
    const configs = [
        {
            label: <Trans>Push notifications</Trans>,
            description: <Trans>Turn on notifications to never miss important alerts.</Trans>,
            platform: NotificationPlatform.All,
            pushType: NotificationPushType.All,
            type: NotificationTitle.NotificationsMode,
            value: data.push_switch === true,
        },
        ...data.list.reduce<NotificationConfig[]>((acc, { title, list }) => {
            const parentConfig = list.length <= 1 ? list[0] : list.find((x) => !!x.sub_type?.length);
            if (parentConfig) {
                acc.push({
                    label: title,
                    description: getDescription(parentConfig),
                    platform: parentConfig.platform,
                    pushType: parentConfig.push_type,
                    value: parentConfig.state,
                    children: compact(
                        (parentConfig.sub_type || []).map((subType) => {
                            const subConfig = list.find((x) => x.push_type === subType);
                            return subConfig
                                ? {
                                      label: subConfig.title,
                                      description: getDescription(subConfig),
                                      platform: subConfig.platform,
                                      pushType: subConfig.push_type,
                                      value: subConfig.state,
                                  }
                                : null;
                        }),
                    ),
                });
            }

            list.forEach((config) => {
                if (
                    !parentConfig ||
                    (!isSameConfig(config, parentConfig) && !parentConfig.sub_type?.includes(config.push_type))
                ) {
                    acc.push({
                        label: config.title,
                        description: getDescription(config),
                        platform: config.platform,
                        pushType: config.push_type,
                        value: config.state,
                    });
                }
            });

            return acc;
        }, []),
    ];

    return configs;
}
