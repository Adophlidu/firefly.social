import { t } from '@lingui/core/macro';
import { notFound } from 'next/navigation.js';

import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import type { FollowingSource } from '@/constants/enum.js';
import { FOLLOWING_SOURCES } from '@/constants/index.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import type { NextPageProps } from '@/types/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(t`Following`),
    });
}

interface Props extends NextPageProps<{ source: string }> {}

export default async function Layout(props: Props) {
    const params = await props.params;
    const { children } = props;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !FOLLOWING_SOURCES.includes(source as FollowingSource)) notFound();
    return (
        <>
            <SourceTabs>
                {FOLLOWING_SOURCES.map((x) => (
                    <SourceTab key={x} href={resolveFollowingUrl(x)} isActive={x === source}>
                        {resolveSourceName(x)}
                    </SourceTab>
                ))}
            </SourceTabs>
            {children}
        </>
    );
}
