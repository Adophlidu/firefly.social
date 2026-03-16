import { NFTDetailPage } from '@/app/(normal)/nft/pages/NFTDetailPage.js';
import { notFound } from '@/esm/navigation/server.js';
import { parseChainId } from '@/helpers/parseChainId.js';
import { createNftMetadata } from '@/providers/firefly/metadata/createNftMetadata.js';
import { type LayoutProps } from '@/types/utility.js';

interface Props
    extends LayoutProps<{
        addressOrTokenId: string;
        tokenId: string;
        chainIdOrCollectionId: string;
    }> {}

export async function generateMetadata(props: Props) {
    const { addressOrTokenId, tokenId, chainIdOrCollectionId } = await props.params;
    return createNftMetadata(
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
