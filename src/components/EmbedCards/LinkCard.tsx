import { type HTMLProps, memo, useLayoutEffect } from 'react';

import { Indicator, type IndicatorProps } from '@/components/EmbedCards/Indicator.js';
import { CollectionPreviewer, NFTPreviewer } from '@/components/NFTs/NFTPreview.js';
import { useClassifyPostLink } from '@/hooks/useClassifyPostLink.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';

interface EmbedLinkCardProps extends HTMLProps<HTMLDivElement> {
    link: string;
}

export const EmbedLinkCard = memo<EmbedLinkCardProps>(function EmbedLinkCard({ link, className }) {
    const { isLoading, error, data } = useClassifyPostLink(link);
    const linkCollection = data?.collection;
    const address = linkCollection?.contract_address;
    const collectionChainId = linkCollection?.chain_id;
    const isCollection = !data?.nft && !!collectionChainId && !!address;
    const hasDeployPlatformLogo = linkCollection?.deployPlatformLogo;
    const { data: collection = linkCollection } = useNFTCollection(
        address || '',
        collectionChainId,
        isCollection && !hasDeployPlatformLogo,
    );

    if (isLoading || error || !data) return null;

    if (data.nft) return <NFTPreviewer nft={data.nft} showTradeInfo className={className} />;
    if (collection) return <CollectionPreviewer collection={collection} showTradeInfo className={className} />;
    return null;
});

interface LinkCardIndicatorProps extends IndicatorProps, Pick<EmbedLinkCardProps, 'link'> {
    onAvailableUpdate: (data: string, available: boolean) => void;
}
export const LinkCardIndicator = memo<LinkCardIndicatorProps>(function LinkCardIndicator({
    link,
    onAvailableUpdate,
    ...rest
}) {
    const { isLoading, error, data } = useClassifyPostLink(link);

    const available = !isLoading && !error && (!!data?.nft || !!data?.collection?.contract_address);

    useLayoutEffect(() => {
        onAvailableUpdate(link, available);
    }, [available, link, onAvailableUpdate]);

    if (!available) return null;

    return <Indicator {...rest} />;
});
