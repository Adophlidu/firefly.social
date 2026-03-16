'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Suspense, use } from 'react';

import { ArticleBookmarkList } from '@/app/(normal)/bookmarks/ArticleBookmarkList.js';
import { BookmarkList } from '@/app/(normal)/bookmarks/BookmarkList.js';
import { NFTBookmarkList } from '@/app/(normal)/bookmarks/NFTBookmarkList.js';
import { PredictionBookmarkList } from '@/app/(normal)/bookmarks/PredictionBookmarkList.js';
import { TokenBookmarkList } from '@/app/(normal)/bookmarks/TokenBookmarkList.js';
import { Loading } from '@/components/Loading.js';
import { SnapshotBookmarkList } from '@/components/Snapshot/SnapshotBookmarkList.js';
import { type BookmarkSource, Source, type SourceInURL } from '@/constants/enum.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { useMounted } from '@/hooks/useMounted.js';
import { type LayoutProps } from '@/types/utility.js';

function BookmarkListContent({ source }: { source: BookmarkSource }) {
    switch (source) {
        case Source.DAOs:
            return <SnapshotBookmarkList />;
        case Source.Article:
            return <ArticleBookmarkList />;
        case Source.NFTs:
            return <NFTBookmarkList />;
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
