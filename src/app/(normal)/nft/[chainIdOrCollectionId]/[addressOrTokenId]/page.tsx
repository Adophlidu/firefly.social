import { NFTCollectionPage } from '@/app/(normal)/nft/pages/NFTCollectionPage.js';
import { NFTDetailPage } from '@/app/(normal)/nft/pages/NFTDetailPage.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataNFT, createMetadataNFTCollection } from '@/helpers/createMetadataNFT.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isValidChainIdEthereum, isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { parseChainId } from '@/helpers/parseChainId.js';
import { resolveCollectionChain } from '@/helpers/resolveCollectionChain.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ addressOrTokenId: string; chainIdOrCollectionId: string }> {}

function isNFTDetailPage(chainIdOrCollectionId: string, addressOrTokenId: string) {
    const isChainId = isValidChainIdEthereum(+chainIdOrCollectionId) || isValidChainIdSolana(+chainIdOrCollectionId);
    return !isChainId && !isValidAddressEthereum(addressOrTokenId);
}

export async function generateMetadata(props: Props) {
    const params = await props.params;
    const { addressOrTokenId, chainIdOrCollectionId } = params;

    const chainId = parseChainId(chainIdOrCollectionId);
    if (isNFTDetailPage(chainIdOrCollectionId, addressOrTokenId) && chainId) {
        const collection = await runInSafeAsync(() => FireflyEndpointProvider.getCollection(chainId, addressOrTokenId));
        if (collection) {
            const { contract_address: address, chain_id: chainId } = collection;
            return createMetadataNFT(+chainId, address, addressOrTokenId);
        }
    }
    if (chainId) return createMetadataNFTCollection(chainId, addressOrTokenId);
    return createSiteMetadata();
}

export default async function Page(props: Props) {
    const params = await props.params;
    const { addressOrTokenId, chainIdOrCollectionId } = params;

    if (chainIdOrCollectionId === 'solana') {
        notFound();
    }
    const chainId = parseChainId(chainIdOrCollectionId);
    if (!chainId) notFound();

    if (isNFTDetailPage(chainIdOrCollectionId, addressOrTokenId)) {
        const collection = await FireflyEndpointProvider.getCollection(chainId, addressOrTokenId);
        if (collection) {
            const { address, chainId } = resolveCollectionChain(collection);
            return <NFTDetailPage chainId={chainId} address={address} tokenId={addressOrTokenId} />;
        }
    }

    return <NFTCollectionPage chainId={chainId} address={addressOrTokenId} />;
}
