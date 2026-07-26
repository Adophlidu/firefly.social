import type { NotificationSourceInURL } from '@dimensiondev/enums';
import { useParams } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { NotificationSettings } from '@/components/Notification/NotificationSettings.js';
import { NotificationTabs } from '@/components/Notification/NotificationTabs.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { resolveNotificationSource } from '@/helpers/resolveSourceInUrl.js';

/**
 * Port of the Next notifications layout
 * (src/app/[locale]/(normal)/notifications/[source]/layout.tsx):
 * sticky title + source tabs above the notification list. The whole
 * notifications subtree is client-only, so children render directly
 * without the old NoSSR wrapper.
 */
export default function NotificationsLayout({ children }: { children?: ReactNode }) {
    const params = useParams();
    const source = resolveNotificationSource(params.source as NotificationSourceInURL);

    return (
        <div className="flex w-full flex-col">
            <div className="sticky top-[54px] z-30 flex w-full flex-col bg-primaryBottom md:top-0">
                <TimelineTitle title={<Trans>Notifications</Trans>} />
                <div className="flex items-center justify-between px-4">
                    <NotificationTabs source={source} />
                    <NotificationSettings source={source} />
                </div>
            </div>
            {children}
        </div>
    );
}
