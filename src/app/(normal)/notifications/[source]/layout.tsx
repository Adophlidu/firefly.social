import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type PropsWithChildren } from 'react';

import { NotificationSettings } from '@/components/Notification/NotificationSettings.js';
import { NotificationTabs } from '@/components/Notification/NotificationTabs.js';
import type { NotificationSourceInURL } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveNotificationSource } from '@/helpers/resolveSourceInUrl.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(() => t`Notifications`),
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
                <div className="flex h-[60px] w-full items-center px-4 pt-2.5 max-md:hidden">
                    <h1 className="text-[20px] font-bold leading-6">
                        <Trans>Notifications</Trans>
                    </h1>
                </div>
                <div className="flex items-center justify-between px-4">
                    <NotificationTabs source={resolveNotificationSource(source)} />
                    <NotificationSettings source={resolveNotificationSource(source)} />
                </div>
            </div>
            {props.children}
        </div>
    );
}
