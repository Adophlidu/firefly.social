import { NFTDetailPage } from '@/app/(normal)/nft/pages/NFTDetailPage.js';
import { notFound } from '@/esm/navigation/server.js';
import { parseChainId } from '@/helpers/parseChainId.js';
import { fireflyMetadataProvider } from '@/providers/firefly/Metadata.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        addressOrTokenId: string;
        tokenId: string;
        chainIdOrCollectionId: string;
    }> {}

export async function generateMetadata(props: Props) {
    const { addressOrTokenId, tokenId, chainIdOrCollectionId } = await props.params;
    return fireflyMetadataProvider.createNftMetadata(
        addressOrTokenId,
        chainIdOrCollectionId,
        tokenId,
        `/nft/${chainIdOrCollectionId}/${addressOrTokenId}/${tokenId}`,
    );
}

export default async function Page(props: Props) {
    const { addressOrTokenId, tokenId, chainIdOrCollectionId } = await props.params;
    const chainId = parseChainId(chainIdOrCollectionId);
    if (!chainId) notFound();
    return <NFTDetailPage chainId={chainId} tokenId={tokenId} address={addressOrTokenId} />;
}
