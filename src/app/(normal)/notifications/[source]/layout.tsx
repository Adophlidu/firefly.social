import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type PropsWithChildren } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { NotificationSettings } from '@/components/Notification/NotificationSettings.js';
import { NotificationTabs } from '@/components/Notification/NotificationTabs.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import type { NotificationSourceInURL } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveNotificationSource } from '@/helpers/resolveSourceInUrl.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(msg`Notifications`),
    });
}

interface Props extends PropsWithChildren {
    params: Promise<{ source: NotificationSourceInURL }>;
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const { source } = await props.params;

    return (
        <div className="flex w-full flex-col">
            <div className="sticky top-[54px] z-20 flex w-full flex-col bg-primaryBottom md:top-0">
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
