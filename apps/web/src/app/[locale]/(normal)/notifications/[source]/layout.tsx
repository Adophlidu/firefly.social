import type { NotificationSourceInURL } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';

import { NoSSR } from '@/components/NoSSR.js';
import { NotificationSettings } from '@/components/Notification/NotificationSettings.js';
import { NotificationTabs } from '@/components/Notification/NotificationTabs.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { resolveNotificationSource } from '@/helpers/resolveSourceInUrl.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

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

interface Props extends LayoutProps<{ source: string; locale: string }> {}

export default async function Layout(props: Props) {
    const params = await props.params;
    setupLocaleFromParams(params.locale);

    const source = params.source as NotificationSourceInURL;

    return (
        <div className="flex w-full flex-col">
            <div className="sticky top-[54px] z-30 flex w-full flex-col bg-primaryBottom md:top-0">
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
