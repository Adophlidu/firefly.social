import type { LayoutProps } from '@dimensiondev/types';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { BookmarkSourceTabs } from '@/app/[locale]/(normal)/bookmarks/[source]/BookmarkSourceTabs.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { Source, SourceInURL } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { isBookmarkSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

const BOOKMARK_SOURCE_PARAMS: SourceInURL[] = [
    SourceInURL.Lens,
    SourceInURL.Farcaster,
    SourceInURL.Bsky,
    SourceInURL.Tokens,
    SourceInURL.Prediction,
    SourceInURL.NFTs,
    SourceInURL.Article,
    SourceInURL.DAOs,
];

export function generateStaticParams() {
    return BOOKMARK_SOURCE_PARAMS.map((source) => ({ source }));
}

interface Props extends LayoutProps<{ source: string }> {}

export default async function Layout(props: Props) {
    const params = await props.params;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isBookmarkSource(source)) notFound();

    return (
        <div>
            <div className="bg-primaryBottom sticky top-[54px] z-20 pb-3 md:top-0">
                <TimelineTitle title={<Trans>Bookmarks</Trans>} />
                <div className="px-4">
                    <BookmarkSourceTabs source={source} />
                </div>
            </div>
            <div className={classNames(source !== Source.Tokens ? 'px-4' : null)}>{props.children}</div>
        </div>
    );
}
