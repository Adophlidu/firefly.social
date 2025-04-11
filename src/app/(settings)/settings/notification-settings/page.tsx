'use client';

import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { Headline } from '@/app/(settings)/components/Headline.js';
import {
    NotificationChildConfigItem,
    NotificationConfigItem,
} from '@/app/(settings)/components/NotificationConfigItem.js';
import { Section } from '@/app/(settings)/components/Section.js';
import {
    getNotificationConfigs,
    type NotificationConfig,
} from '@/app/(settings)/settings/notification-settings/getNotificationConfigs.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useNavigatorTitle } from '@/hooks/useNavigatorTitle.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { NotificationPlatform, type NotificationPushSwitchResponse } from '@/providers/types/Firefly.js';
import { setupFirebaseFcmConnection } from '@/services/setupFirebaseFcmConnection.js';

function getStatusForConfigs(
    configs: NotificationConfig[],
    response?: Required<NotificationPushSwitchResponse>['data'],
): NotificationConfig[] {
    const allStatus = Object.values(response?.list || {}).flatMap((x) => x.list);
    return configs.map((config) => {
        const status = allStatus.find((x) => x.platform === config.platform && x.push_type === config.pushType);
        const isGlobalSwitch = config.platform === NotificationPlatform.All;

        return {
            ...config,
            unsupported: isGlobalSwitch ? false : !status,
            value: isGlobalSwitch ? response?.push_switch === true : status?.state === true,
            children: config.children?.length ? getStatusForConfigs(config.children, response) : [],
        };
    });
}

export default function NotificationPage() {
    useNavigatorTitle(msg`Notifications`);

    const { data, isLoading } = useQuery({
        queryKey: ['notification-settings', 'config'],
        queryFn: async () => {
            const data = await FireflySocialMediaProvider.getNotificationPushSwitch();
            return data;
        },
    });

    const configs = useMemo<NotificationConfig[]>(() => {
        return getStatusForConfigs(getNotificationConfigs(), data);
    }, [data]);

    useEffect(() => {
        setupFirebaseFcmConnection({ force: true, showUi: true });
    }, []);

    const globalSwitch = configs.find((x) => x.platform === NotificationPlatform.All)?.value;

    return (
        <Section>
            <Headline>
                <Trans>Push notifications</Trans>
            </Headline>

            <div className="relative w-full space-y-6">
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <LoadingIcon size={24} />
                    </div>
                ) : (
                    configs.map(({ children, ...rest }) => (
                        <div key={rest.pushType} className="rounded-lg border border-line px-3 py-2">
                            <NotificationConfigItem
                                key={rest.pushType}
                                {...rest}
                                disabled={rest.platform !== NotificationPlatform.All && !globalSwitch}
                            />
                            {children?.length ? (
                                <div className="mt-4 border-t border-line pt-2">
                                    {children?.map(({ children, ...subConfig }) => (
                                        <NotificationChildConfigItem
                                            key={subConfig.pushType}
                                            {...subConfig}
                                            disabled={!rest.value || !globalSwitch}
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ))
                )}
            </div>
        </Section>
    );
}
