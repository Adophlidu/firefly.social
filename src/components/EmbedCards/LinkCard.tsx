import { type HTMLProps, memo, useLayoutEffect } from 'react';

import { Indicator, type IndicatorProps } from '@/components/EmbedCards/Indicator.js';
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
    if (data.collection?.contract_address)
        return <CollectionPreviewer collection={data.collection} showTradeInfo className={className} />;
    return null;
});

interface LinkCardIndicatorProps extends IndicatorProps, Pick<EmbedLinkCardProps, 'link' | 'post'> {
    onAvailableUpdate: (data: string, available: boolean) => void;
}
export const LinkCardIndicator = memo<LinkCardIndicatorProps>(function LinkCardIndicator({
    link,
    post,
    onAvailableUpdate,
    ...rest
}) {
    const { isLoading, error, data } = useClassifyPostLink(link, post);

    const available = !isLoading && !error && (!!data?.nft || !!data?.collection?.contract_address);

    useLayoutEffect(() => {
        onAvailableUpdate(link, available);
    }, [available, link, onAvailableUpdate]);

    if (!available) return null;

    return <Indicator {...rest} />;
});
