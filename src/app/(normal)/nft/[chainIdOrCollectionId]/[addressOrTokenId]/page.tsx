import { NFTCollectionPage } from '@/app/(normal)/nft/pages/NFTCollectionPage.js';
import { NFTDetailPage } from '@/app/(normal)/nft/pages/NFTDetailPage.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isValidChainIdEthereum, isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { parseChainId } from '@/helpers/parseChainId.js';
import { resolveCollectionChain } from '@/helpers/resolveCollectionChain.js';
import { createNftCollectionMetadata } from '@/providers/firefly/metadata/createNftCollectionMetadata.js';
import { getCollection } from '@/providers/firefly/nft/getCollection.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ addressOrTokenId: string; chainIdOrCollectionId: string }> {}

function isNFTDetailPage(chainIdOrCollectionId: string, addressOrTokenId: string) {
    const isChainId = isValidChainIdEthereum(+chainIdOrCollectionId) || isValidChainIdSolana(+chainIdOrCollectionId);
    return !isChainId && !isValidAddressEthereum(addressOrTokenId);
}

export async function generateMetadata(props: Props) {
    const { addressOrTokenId, chainIdOrCollectionId } = await props.params;

    return createNftCollectionMetadata(
        chainIdOrCollectionId,
        addressOrTokenId,
        `/nft/${chainIdOrCollectionId}/${addressOrTokenId}`,
    );
}

export default async function Page(props: Props) {
    const { addressOrTokenId, chainIdOrCollectionId } = await props.params;

    if (chainIdOrCollectionId === 'solana') notFound();
    const chainId = parseChainId(chainIdOrCollectionId);
    if (!chainId) notFound();

    if (isNFTDetailPage(chainIdOrCollectionId, addressOrTokenId)) {
        const collection = await getCollection(chainId, addressOrTokenId);
        if (collection) {
            const { address, chainId } = resolveCollectionChain(collection);
            return <NFTDetailPage chainId={chainId} address={address} tokenId={addressOrTokenId} />;
        }
    }

    return <NFTCollectionPage chainId={chainId} address={addressOrTokenId} />;
}
