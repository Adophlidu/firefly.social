import type { BookmarkSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { BookmarkSourceTabs } from '@/legacy/[locale]/(normal)/bookmarks/[source]/BookmarkSourceTabs.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { isBookmarkSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

interface BookmarksLayoutData {
    source: BookmarkSource;
}

export function loader({ params }: LoaderContext): BookmarksLayoutData {
    const source = resolveSourceFromUrlNoFallback(params.source!);
    if (!source || !isBookmarkSource(source)) notFound();

    return { source };
}

/**
 * Port of the Next bookmarks layout
 * (src/app/[locale]/(normal)/bookmarks/[source]/layout.tsx):
 * sticky title + source tabs above the bookmark list.
 */
export default function BookmarksLayout({ children }: { children?: ReactNode }) {
    const { source } = useLoaderData<BookmarksLayoutData>('bookmarks/$source/_layout.tsx');

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
