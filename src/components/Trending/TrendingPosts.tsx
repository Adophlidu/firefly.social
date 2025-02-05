'use client';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';

import { AsideTitle } from '@/components/AsideTitle.js';
import { Link } from '@/components/Link.js';
import { PostDigest } from '@/components/Trending/PostDigest.js';
import { ExploreType, Source } from '@/constants/enum.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';

export function TrendingPosts() {
    const { data } = useQuery({
        queryKey: ['trending-posts', Source.Bsky],
        queryFn: () => BskySocialMediaProvider.discoverPosts(),
        select: (data) => data.data,
    });

    if (!data?.length) return null;
    const picked = data.filter((x) => x.metadata.content?.content).slice(0, 3);

    return (
        <section>
            <AsideTitle className="flex items-center justify-between">
                <span className="text-xl">
                    <Trans>Trending Posts</Trans>
                </span>
                {data?.length > 3 ? (
                    <Link
                        className="text-medium text-highlight"
                        href={resolveExploreUrl(ExploreType.Feeds, Source.Bsky)}
                    >
                        <Trans>More</Trans>
                    </Link>
                ) : null}
            </AsideTitle>
            <div className="flex flex-col rounded-xl bg-lightBg py-[18px]">
                {picked.map((post) => (
                    <PostDigest key={post.postId} post={post} />
                ))}
            </div>
        </section>
    );
}
