import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { type ReactNode } from 'react';

import {
    type NotificationConfig,
    type NotificationConfigsResponse,
    NotificationPlatform,
    NotificationPushType,
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

function toNotificationConfig(data: ConfigItem): NotificationConfig {
    return {
        label: data.title,
        description: getDescription(data),
        platform: data.platform,
        pushType: data.push_type,
        value: data.state,
    };
}

export function formatNotificationConfigs(data: NotificationData): Array<{
    groupName: string;
    list: NotificationConfig[];
}> {
    return [
        {
            groupName: 'global',
            list: [
                {
                    label: <Trans>Push notifications</Trans>,
                    description: <Trans>Turn on notifications to never miss important alerts.</Trans>,
                    platform: NotificationPlatform.All,
                    pushType: NotificationPushType.All,
                    value: data.push_switch === true,
                },
            ],
        },
        ...data.list.map(({ title, list }) => {
            const sortedList = list.slice().sort((a) => (a.sub_type?.length ? -1 : 1));
            const visited = new Set<NotificationPushType>();
            const groupList = sortedList.reduce<NotificationConfig[]>((acc, config) => {
                if (visited.has(config.push_type)) return acc;
                visited.add(config.push_type);

                acc.push({
                    ...toNotificationConfig(config),
                    children: compact(
                        (config.sub_type || []).map((sub) => {
                            if (visited.has(sub)) return null;
                            visited.add(sub);

                            const subConfig = sortedList.find((c) => c.push_type === sub);
                            if (!subConfig) return null;

                            return toNotificationConfig(subConfig);
                        }),
                    ),
                });

                return acc;
            }, []);

            return {
                groupName: title,
                list: groupList,
            };
        }),
    ];
}
