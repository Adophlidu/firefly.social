import type { BookmarkSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { useParams } from '@dimensiondev/ssr';
import { safeUnreachable } from '@dimensiondev/utils';
import { Suspense } from 'react';

import { FeedErrorBoundary } from '@/components/FeedErrorBoundary.js';
import { Loading } from '@/components/Loading.js';
import { SnapshotBookmarkList } from '@/components/Snapshot/SnapshotBookmarkList.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { useMounted } from '@/hooks/useMounted.js';
import { ArticleBookmarkList } from '@/legacy/[locale]/(normal)/bookmarks/ArticleBookmarkList.js';
import { BookmarkList } from '@/legacy/[locale]/(normal)/bookmarks/BookmarkList.js';
import { PredictionBookmarkList } from '@/legacy/[locale]/(normal)/bookmarks/PredictionBookmarkList.js';
import { TokenBookmarkList } from '@/legacy/[locale]/(normal)/bookmarks/TokenBookmarkList.js';

function BookmarkListContent({ source }: { source: BookmarkSource }) {
    switch (source) {
        case Source.DAOs:
            return <SnapshotBookmarkList />;
        case Source.Article:
            return <ArticleBookmarkList />;
        case Source.Tokens:
            return <TokenBookmarkList />;
        case Source.Prediction:
            return <PredictionBookmarkList />;
        case Source.Farcaster:
        case Source.Lens:
        case Source.Bsky:
            return <BookmarkList source={source} />;

        default:
            safeUnreachable(source);
            return null;
    }
}

export default function BookmarkSourcePage() {
    const params = useParams();
    const mounted = useMounted();
    const source = resolveSource(params.source as never) as BookmarkSource;

    if (!mounted) return null;

    return (
        <FeedErrorBoundary>
            <Suspense fallback={<Loading />}>
                <BookmarkListContent source={source} />
            </Suspense>
        </FeedErrorBoundary>
    );
}
