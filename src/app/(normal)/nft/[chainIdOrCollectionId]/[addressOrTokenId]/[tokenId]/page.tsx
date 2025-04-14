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
    const params = await props.params;
    const { addressOrTokenId, tokenId, chainIdOrCollectionId } = params;
    const chainId = parseChainId(chainIdOrCollectionId);
    if (chainId) return createMetadataNFT(chainId, addressOrTokenId, tokenId);
    return createSiteMetadata();
}

export default async function Page(props: Props) {
    const { addressOrTokenId, tokenId, chainIdOrCollectionId } = await props.params;
    const chainId = parseChainId(chainIdOrCollectionId);
    if (!chainId) notFound();
    return <NFTDetailPage chainId={chainId} tokenId={tokenId} address={addressOrTokenId} />;
}
