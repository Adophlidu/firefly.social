import { NFTDetailPage } from '@/app/(normal)/nft/pages/NFTDetailPage.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataNFT } from '@/helpers/createMetadataNFT.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { parseChainId } from '@/helpers/parseChainId.js';
import type { NextPageProps } from '@/types/index.js';

interface Props
    extends NextPageProps<{
        addressOrTokenId: string;
        tokenId: string;
        chainIdOrCollectionId: string;
    }> {}

export async function generateMetadata(props: Props) {
    const { addressOrTokenId, tokenId, chainIdOrCollectionId } = await props.params;
    const chainId = parseChainId(chainIdOrCollectionId);
    if (chainId)
        return createMetadataNFT(
            `/nft/${chainIdOrCollectionId}/${addressOrTokenId}/${tokenId}`,
            chainId,
            addressOrTokenId,
            tokenId,
        );
    return createSiteMetadata(`/nft/${chainIdOrCollectionId}/${addressOrTokenId}/${tokenId}`);
}

export default async function Page(props: Props) {
    const { addressOrTokenId, tokenId, chainIdOrCollectionId } = await props.params;
    const chainId = parseChainId(chainIdOrCollectionId);
    if (!chainId) notFound();
    return <NFTDetailPage chainId={chainId} tokenId={tokenId} address={addressOrTokenId} />;
}
