import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { BookmarkSourceTabs } from '@/app/(normal)/bookmarks/[source]/BookmarkSourceTabs.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { Source } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { classNames } from '@/helpers/classNames.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isBookmarkSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ source: string }> {}

export async function generateMetadata(props: Props) {
    const { source } = await props.params;

    return createSiteMetadata(`/bookmarks/${source}`, {
        title: await createPageTitleSSR(msg`Bookmarks`),
    });
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const params = await props.params;
    const { children } = props;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isBookmarkSource(source)) notFound();

    return (
        <div>
            <div className="sticky top-[54px] z-20 bg-primaryBottom pb-3 md:top-0">
                <TimelineTitle title={<Trans>Bookmarks</Trans>} />
                <div className="px-4">
                    <BookmarkSourceTabs source={source} />
                </div>
            </div>
            <div className={classNames(source !== Source.Tokens ? 'px-4' : null)}>{children}</div>
        </div>
    );
}
