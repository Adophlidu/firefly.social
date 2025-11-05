import { useMemo } from 'react';

import type { ClassifyPostLinkResult } from '@/app/api/post-link/getClassifyPostLinkWithDeserialization.js';
import { ArticleBody } from '@/components/Article/ArticleBody.js';
import { FrameLayout } from '@/components/Frame/Layout.js';
import { CollectionPreviewer, NFTPreviewer } from '@/components/NFTs/NFTPreview.js';
import { OembedLayout } from '@/components/Oembed/index.js';
import { Player } from '@/components/Oembed/Player.js';
import { checkIfHasRedPacket } from '@/components/Posts/PostBodyContent.js';
import { PureLink } from '@/components/Posts/PureLink.js';
import { Quote } from '@/components/Posts/Quote.js';
import { TweetSpace } from '@/components/Posts/TweetSpace.js';
import { SnapshotBody } from '@/components/Snapshot/SnapshotBody.js';
import { useRouter } from '@/esm/navigation.js';
import { getArticleUrl } from '@/helpers/getArticleUrl.js';
import { isLinkMatchingHost } from '@/helpers/isLinkMatchingHost.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface PostLinkContentProps {
    data: ClassifyPostLinkResult | null;
    url: string;
    post: Post;
    isInCompose?: boolean;
}

export function PostLinkContent({ data, url, post, isInCompose }: PostLinkContentProps) {
    const router = useRouter();
    const isLargeOembed = useMemo(() => {
        const hasAttachments = !!post.metadata.content?.attachments?.length;
        if (hasAttachments) return false;
        if (checkIfHasRedPacket(post)) return false;
        if (post.poll) return false;
        return data?.oembed?.og.isLarge;
    }, [data?.oembed?.og.isLarge, post]);

    const quote = useMemo(() => {
        if (!data?.quote) return null;
        if (post.type === 'Mirror' && post.parentPostId === data?.quote?.postId) return null;
        if (data.quote.postId === post.postId) return null;
        return data.quote;
    }, [data?.quote, post]);

    // If the url occurs in the content, it might be rendered as an embed card as well.
    const isInContent = !!post.metadata.content?.content?.includes(url);

    if (!data) {
        if (isInContent) return <PureLink url={url} className="mt-2" />;
        return null;
    }

    return (
        <>
            {data.article ? (
                <ArticleBody
                    article={data.article}
                    onClick={() => {
                        if (isInCompose) return;

                        if (!data.article || data.article.author.isMuted) return;

                        const selection = window.getSelection();
                        if (selection && selection.toString().length !== 0) return;

                        router.push(getArticleUrl(data.article));
                        return;
                    }}
                />
            ) : null}
            {quote ? <Quote post={quote} /> : null}
            {data.snapshot && !isInCompose ? (
                <SnapshotBody snapshot={data.snapshot} link={url} postId={post.postId} />
            ) : null}
            {data.html ? (
                <Player html={data.html} isSpotify={isLinkMatchingHost(url, 'open.spotify.com', false)} />
            ) : null}
            {data.frame ? <FrameLayout frame={data.frame} post={post} /> : null}
            {data.oembed && !post.quoteOn ? (
                <OembedLayout
                    data={{
                        ...data.oembed,
                        og: { ...data.oembed.og, isLarge: isLargeOembed ?? data.oembed.og.isLarge },
                    }}
                />
            ) : null}
            {data.spaceId ? <TweetSpace spaceId={data.spaceId} /> : null}
            {data?.nft ? <NFTPreviewer nft={data.nft} /> : null}
            {data?.collection && !isInContent ? <CollectionPreviewer collection={data.collection} /> : null}
        </>
    );
}
