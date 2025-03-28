'use client';

import { Trans } from '@lingui/react/macro';
import { type PropsWithChildren, use } from 'react';

import { NotificationSettings } from '@/components/Notification/NotificationSettings.js';
import { SolidTabs } from '@/components/Tabs/SolidTabs.js';
import { queryClient } from '@/configs/queryClient.js';
import type { NotificationSourceInURL } from '@/constants/enum.js';
import { SORTED_NOTIFICATIONS_SOURCES } from '@/constants/index.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { resolveNotificationSource } from '@/helpers/resolveSourceInUrl.js';
import { resolveNotificationSourceName } from '@/helpers/resolveSourceName.js';

interface Props extends PropsWithChildren {
    params: Promise<{ source: NotificationSourceInURL }>;
}

export default function Layout({ children, params }: Props) {
    const { source } = use(params);

    return (
        <div className="flex w-full flex-col">
            <div className="sticky top-[54px] z-20 flex w-full flex-col bg-primaryBottom md:top-0">
                <h1 className="px-4 py-[18px] text-[20px] font-bold leading-6 max-md:hidden">
                    <Trans>Notifications</Trans>
                </h1>
                <div className="flex items-center justify-between px-4">
                    <SolidTabs
                        data={SORTED_NOTIFICATIONS_SOURCES}
                        link={resolveNotificationUrl}
                        itemRender={resolveNotificationSourceName}
                        isSelected={(x) => x === resolveNotificationSource(source)}
                        onChange={(target) => {
                            if (target !== resolveNotificationSource(source)) return;

                            queryClient.refetchQueries({
                                queryKey: ['notifications', target],
                            });
                            queryClient.invalidateQueries({
                                queryKey: ['notification', target],
                            });
                        }}
                    />
                    <NotificationSettings source={resolveNotificationSource(source)} />
                </div>
            </div>
            {children}
        </div>
    );
}
