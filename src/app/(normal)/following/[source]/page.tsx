import { FollowingArticleList } from '@/components/Article/FollowingArticleList.js';
import { FollowingNFTList } from '@/components/NFTs/FollowingNFTList.js';
import { PolymarketTimeLine } from '@/components/Polymarket/PolymarketTimeLine.js';
import { FollowingPostList } from '@/components/Posts/FollowingPostList.js';
import { FollowingSnapshotList } from '@/components/Snapshot/FollowingSnapshotList.js';
import { type FollowingSource, Source, SourceInURL } from '@/constants/enum.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ source: SourceInURL }> {}

export default async function Page(props: Props) {
    const params = await props.params;
    const source = resolveSource(params.source) as FollowingSource;
    if (source === Source.DAOs) {
        return <FollowingSnapshotList />;
    }
    if (source === Source.Article) {
        return <FollowingArticleList />;
    }

    if (source === Source.NFTs) {
        return <FollowingNFTList />;
    }

    if (source === Source.Polymarket) {
        return <PolymarketTimeLine isFollowing />;
    }

    return <FollowingPostList source={source} />;
}
