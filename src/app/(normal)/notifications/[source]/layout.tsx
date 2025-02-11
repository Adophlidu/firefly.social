import { t } from '@lingui/core/macro';
import { notFound } from 'next/navigation.js';

import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { SOCIAL_NOTIFICATION_SOURCE } from '@/constants/index.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialDiscoverSource } from '@/helpers/isDiscoverSource.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import type { NextPageProps } from '@/types/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(() => t`Notifications`),
    });
}

interface Props extends NextPageProps<{ source: string }> {}

export default async function Layout(props: Props) {
    const params = await props.params;
    const { children } = props;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isSocialDiscoverSource(source)) notFound();

    return (
        <>
            <SourceTabs>
                {SOCIAL_NOTIFICATION_SOURCE.map((x) => (
                    <SourceTab key={x} href={resolveNotificationUrl(x)} isActive={x === source}>
                        {resolveSourceName(x)}
                    </SourceTab>
                ))}
            </SourceTabs>
            {children}
        </>
    );
}
