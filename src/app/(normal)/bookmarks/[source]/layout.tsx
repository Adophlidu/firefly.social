import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { notFound } from 'next/navigation.js';

import { NoSSR } from '@/components/NoSSR.js';
import { SolidSourceTabs } from '@/components/Tabs/SolidSourceTabs.js';
import { BOOKMARK_SOURCES } from '@/constants/index.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isBookmarkSource } from '@/helpers/isBookmarkSource.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(t`Bookmarks`),
    });
}

interface Props extends NextPageProps<{ source: string }> {}

export default async function Layout(props: Props) {
    const params = await props.params;
    const { children } = props;

    await setupLocaleForSSR();

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isBookmarkSource(source)) notFound();
    return (
        <div>
            <div className="sticky top-0 z-10 bg-primaryBottom px-4 pb-2">
                <h1 className="h-[60px] text-xl font-bold leading-[60px] text-main">
                    <Trans>Bookmarks</Trans>
                </h1>
                <NoSSR>
                    <SolidSourceTabs
                        active={source}
                        sources={BOOKMARK_SOURCES.map((s) => ({ source: s, link: resolveBookmarkUrl(s) }))}
                    />
                </NoSSR>
            </div>
            <div className="px-4">{children}</div>
        </div>
    );
}
