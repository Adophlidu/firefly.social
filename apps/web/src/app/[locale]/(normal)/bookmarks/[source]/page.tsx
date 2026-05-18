'use client';

import type { BookmarkSource, SourceInURL } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { safeUnreachable } from '@dimensiondev/utils';
import { Suspense, use } from 'react';

import { ArticleBookmarkList } from '@/app/[locale]/(normal)/bookmarks/ArticleBookmarkList.js';
import { BookmarkList } from '@/app/[locale]/(normal)/bookmarks/BookmarkList.js';
import { PredictionBookmarkList } from '@/app/[locale]/(normal)/bookmarks/PredictionBookmarkList.js';
import { TokenBookmarkList } from '@/app/[locale]/(normal)/bookmarks/TokenBookmarkList.js';
import { Loading } from '@/components/Loading.js';
import { SnapshotBookmarkList } from '@/components/Snapshot/SnapshotBookmarkList.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { useMounted } from '@/hooks/useMounted.js';

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

interface Props extends LayoutProps<{ source: SourceInURL }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    const mounted = useMounted();
    const source = resolveSource(params.source) as BookmarkSource;

    if (!mounted) return null;

    return (
        <Suspense fallback={<Loading />}>
            <BookmarkListContent source={source} />
        </Suspense>
    );
}
