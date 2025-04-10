import { SolanaChainId } from '@masknet/web3-shared-solana';
import { notFound, redirect } from '@/esm/navigation.js';

import { NFTCollectionPage } from '@/app/(normal)/nft/pages/NFTCollectionPage.js';
import { NFTDetailPage } from '@/app/(normal)/nft/pages/NFTDetailPage.js';
import { createMetadataNFT, createMetadataNFTCollection } from '@/helpers/createMetadataNFT.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isValidChainIdEthereum, isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { parseChainId } from '@/helpers/parseChainId.js';
import { resolveCollectionChain } from '@/helpers/resolveCollectionChain.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { SimpleHashProvider } from '@/providers/simplehash/index.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ addressOrTokenId: string; chainIdOrCollectionId: string }> {}

function isNFTDetailPage(chainIdOrCollectionId: string, addressOrTokenId: string) {
    const isChainId = isValidChainIdEthereum(+chainIdOrCollectionId) || isValidChainIdSolana(+chainIdOrCollectionId);
    return !isChainId && !isValidAddressEthereum(addressOrTokenId);
}

export async function generateMetadata(props: Props) {
    const params = await props.params;
    const { addressOrTokenId, chainIdOrCollectionId } = params;

    if (isNFTDetailPage(chainIdOrCollectionId, addressOrTokenId)) {
        const collection = await runInSafeAsync(() => SimpleHashProvider.getCollectionById(chainIdOrCollectionId));
        if (collection) {
            const { address, chainId } = resolveCollectionChain(collection);
            return createMetadataNFT(chainId, address, addressOrTokenId);
        }
    }
    const chainId = parseChainId(chainIdOrCollectionId);
    if (chainId) return createMetadataNFTCollection(chainId, addressOrTokenId);
    return createSiteMetadata();
}

export default async function Page(props: Props) {
    const params = await props.params;
    const { addressOrTokenId, chainIdOrCollectionId } = params;

    if (chainIdOrCollectionId === 'solana') {
        redirect(resolveNFTUrl(SolanaChainId.Mainnet, addressOrTokenId, '0'));
    }
    if (isNFTDetailPage(chainIdOrCollectionId, addressOrTokenId)) {
        const collection = await SimpleHashProvider.getCollectionById(chainIdOrCollectionId);
        if (collection) {
            const { address, chainId } = resolveCollectionChain(collection);
            return <NFTDetailPage chainId={chainId} tokenId={addressOrTokenId} address={address} />;
        }
    }

    const chainId = parseChainId(chainIdOrCollectionId);
    if (!chainId) notFound();

    return <NFTCollectionPage chainId={chainId} address={addressOrTokenId} />;
}
