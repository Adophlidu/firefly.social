import { type HTMLProps, memo } from 'react';

import { CollectionPreviewer, NFTPreviewer } from '@/components/NFTs/NFTPreview.js';
import { useClassifyPostLink } from '@/hooks/useClassifyPostLink.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface EmbedLinkCardProps extends HTMLProps<HTMLDivElement> {
    link: string;
    post: Post;
}

export const EmbedLinkCard = memo<EmbedLinkCardProps>(function EmbedLinkCard({ link, post, className }) {
    const { isLoading, error, data } = useClassifyPostLink(link, post);

    if (isLoading || error || !data) return null;

    if (data.nft) return <NFTPreviewer nft={data.nft} showTradeInfo className={className} />;
    if (data.collection)
        return <CollectionPreviewer collection={data.collection} showTradeInfo className={className} />;
    return null;
});
