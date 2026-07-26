'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { Fragment, useEffect } from 'react';

import {
    NotificationChildConfigItem,
    NotificationConfigItem,
} from '@/app/[locale]/(settings)/components/NotificationConfigItem.js';
import { SettingsSection } from '@/app/[locale]/(settings)/components/Section.js';
import { formatNotificationConfigs } from '@/app/[locale]/(settings)/settings/notification-settings/formatNotificationConfigs.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { getWebNotificationPushSwitch } from '@/providers/firefly/endpoint/getWebNotificationPushSwitch.js';
import { type NotificationConfig, NotificationPlatform } from '@/providers/types/Firefly.js';
import { setupFirebaseFcmConnection } from '@/services/setupFirebaseFcmConnection.js';

interface NotificationGroup {
    groupName: string;
    list: NotificationConfig[];
}

function restructureNotificationGroups(groups: NotificationGroup[] | null | undefined): NotificationGroup[] | null {
    if (!groups) return null;

    return groups.map((group, index) => {
        if (index === 0 || !group.list.length) return group;

        const [firstItem, ...restItems] = group.list;

        return {
            ...group,
            list: [
                {
                    ...firstItem,
                    children: [...(firstItem.children || []), ...restItems],
                },
            ],
        };
    });
}

export default function NotificationPage() {
    const {
        data: rawData,
        isLoading,
        isRefetching,
    } = useQuery({
        queryKey: ['notification-settings', 'config'],
        queryFn: async () => {
            const data = await getWebNotificationPushSwitch();
            return data ? formatNotificationConfigs(data) : null;
        },
    });

    useEffect(() => {
        setupFirebaseFcmConnection({ force: true, showUi: true });
    }, []);

    const data = restructureNotificationGroups(rawData);

    const globalSwitch = first(data)?.list?.find((x) => x.platform === NotificationPlatform.All)?.value;

    return (
        <SettingsSection title={<Trans>Notifications</Trans>}>
            <div className="relative w-full">
                {isLoading || isRefetching ? (
                    <div className="absolute inset-0 flex justify-center bg-primaryBottom/50 pt-32">
                        <LoadingIcon size={24} />
                    </div>
                ) : null}
                <div className="space-y-6">
                    {!data && !isLoading && !isRefetching ? (
                        <NoResultsFallback />
                    ) : (
                        data?.map(({ list, groupName }) =>
                            !list.length ? null : (
                                <div
                                    key={groupName}
                                    className="group space-y-4 rounded-lg border border-line px-3 py-2"
                                >
                                    {list.map(({ children, ...rest }) => (
                                        <Fragment key={rest.pushType}>
                                            <NotificationConfigItem
                                                key={`${rest.pushType}-self`}
                                                {...rest}
                                                disabled={rest.platform !== NotificationPlatform.All && !globalSwitch}
                                                className="border-b border-line pb-4 last:border-b-0 last:pb-0"
                                            />
                                            {children?.length ? (
                                                <div
                                                    className="border-b border-line pb-4 last:border-b-0 last:pb-0"
                                                    key={`${rest.pushType}-children`}
                                                >
                                                    {children?.map(({ children, ...subConfig }) => (
                                                        <NotificationChildConfigItem
                                                            key={subConfig.pushType}
                                                            {...subConfig}
                                                            disabled={!rest.value || !globalSwitch}
                                                        />
                                                    ))}
                                                </div>
                                            ) : null}
                                        </Fragment>
                                    ))}
                                </div>
                            ),
                        )
                    )}
                </div>
            </div>
        </SettingsSection>
    );
}
