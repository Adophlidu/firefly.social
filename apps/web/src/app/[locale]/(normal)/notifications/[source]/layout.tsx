import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { NotificationSettings } from '@/components/Notification/NotificationSettings.js';
import { NotificationTabs } from '@/components/Notification/NotificationTabs.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { type NotificationSourceInURL, SourceInURL } from '@/constants/enum.js';
import { resolveNotificationSource } from '@/helpers/resolveSourceInUrl.js';

const NOTIFICATION_SOURCE_PARAMS: string[] = [
    SourceInURL.Notifications,
    SourceInURL.X,
    SourceInURL.Lens,
    SourceInURL.Farcaster,
    SourceInURL.Bsky,
];

export function generateStaticParams() {
    return NOTIFICATION_SOURCE_PARAMS.map((source) => ({ source }));
}

interface Props extends PropsWithChildren {
    params: Promise<{ source: NotificationSourceInURL }>;
}

export default async function Layout(props: Props) {
    const { source } = await props.params;

    return (
        <div className="flex w-full flex-col">
            <div className="bg-primaryBottom sticky top-[54px] z-30 flex w-full flex-col md:top-0">
                <TimelineTitle title={<Trans>Notifications</Trans>} />
                <div className="flex items-center justify-between px-4">
                    <NotificationTabs source={resolveNotificationSource(source)} />
                    <NotificationSettings source={resolveNotificationSource(source)} />
                </div>
            </div>
            <NoSSR>{props.children}</NoSSR>
        </div>
    );
}
