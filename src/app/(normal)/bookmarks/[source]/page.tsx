'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Suspense, use } from 'react';

import { ArticleBookmarkList } from '@/app/(normal)/bookmarks/ArticleBookmarkList.js';
import { BetsBookmarkList } from '@/app/(normal)/bookmarks/BetsBookmarkList.js';
import { BookmarkList } from '@/app/(normal)/bookmarks/BookmarkList.js';
import { NFTBookmarkList } from '@/app/(normal)/bookmarks/NFTBookmarkList.js';
import { TokenBookmarkList } from '@/app/(normal)/bookmarks/TokenBookmarkList.js';
import { Loading } from '@/components/Loading.js';
import { SnapshotBookmarkList } from '@/components/Snapshot/SnapshotBookmarkList.js';
import { type BookmarkSource, Source, type SourceInURL } from '@/constants/enum.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { useMounted } from '@/hooks/useMounted.js';
import { type NextPageProps } from '@/types/utility.js';

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
        case Source.Bets:
            return <BetsBookmarkList />;
        case Source.Farcaster:
        case Source.Lens:
        case Source.Bsky:
            return <BookmarkList source={source} />;

        default:
            safeUnreachable(source);
            return null;
    }
}

interface Props extends NextPageProps<{ source: SourceInURL }> {}

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
