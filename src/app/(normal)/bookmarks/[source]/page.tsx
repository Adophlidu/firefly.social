'use client';

import { Suspense, use } from 'react';

import { ArticleBookmarkList } from '@/app/(normal)/bookmarks/ArticleBookmarkList.js';
import { BookmarkList } from '@/app/(normal)/bookmarks/BookmarkList.js';
import { NFTBookmarkList } from '@/app/(normal)/bookmarks/NFTBookmarkList.js';
import { Loading } from '@/components/Loading.js';
import { SnapshotBookmarkList } from '@/components/Snapshot/SnapshotBookmarkList.js';
import { type BookmarkSource, Source, SourceInURL } from '@/constants/enum.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { useMounted } from '@/hooks/useMounted.js';
import type { NextPageProps } from '@/types/utility.js';

function BookmarkListContent({ source }: { source: BookmarkSource }) {
    switch (source) {
        case Source.DAOs:
            return <SnapshotBookmarkList />;
        case Source.Article:
            return <ArticleBookmarkList />;
        case Source.NFTs:
            return <NFTBookmarkList />;
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
