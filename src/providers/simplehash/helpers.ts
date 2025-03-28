import { ChainRuntime } from '@/constants/enum.js';
import type { NonFungibleCollection } from '@/mask_pkgs/web3-shared/base/index.js';
import { EthereumChainId, EthereumSchemaType } from '@/mask_pkgs/web3-shared/evm/index.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';
import type { SimpleHash } from '@/providers/simplehash/type.js';

const ChainNameMap: Record<ChainRuntime, Record<number, string>> = {
    [ChainRuntime.Ethereum]: {
        [EthereumChainId.Mainnet]: 'ethereum',
        [EthereumChainId.BSC]: 'bsc',
        [EthereumChainId.Polygon]: 'polygon',
        [EthereumChainId.Arbitrum]: 'arbitrum',
        [EthereumChainId.Optimism]: 'optimism',
        [EthereumChainId.Avalanche]: 'avalanche',
        [EthereumChainId.xDai]: 'gnosis',
        [EthereumChainId.Base]: 'base',
        [EthereumChainId.Scroll]: 'scroll',
        [EthereumChainId.Zora]: 'zora',
    },
    [ChainRuntime.Solana]: {
        [SolanaChainId.Mainnet]: 'solana',
    },
};

export function getAllChainNames(runtime: ChainRuntime) {
    return Object.values(ChainNameMap[runtime]).join(',');
}

export function resolveChain(runtime: ChainRuntime, chainId: number): string | undefined {
    return ChainNameMap[runtime][chainId];
}

export function isLensFollower(name: string) {
    if (!name) return false;
    return name.endsWith('.lens-Follower');
}

function resolveChainId(chain: string): EthereumChainId | undefined {
    // Some of the `chainResolver.chainId()` results do not match.
    switch (chain) {
        case 'ethereum':
            return EthereumChainId.Mainnet;
        case 'polygon':
            return EthereumChainId.Polygon;
        case 'arbitrum':
            return EthereumChainId.Arbitrum;
        case 'optimism':
            return EthereumChainId.Optimism;
        case 'avalanche':
            return EthereumChainId.Avalanche;
        case 'gnosis':
            return EthereumChainId.xDai;
        case 'bsc':
            return EthereumChainId.BSC;
        case 'base':
            return EthereumChainId.Base;
        case 'scroll':
            return EthereumChainId.Scroll;
        case 'zora':
            return EthereumChainId.Zora;
        default:
            return undefined;
    }
}

export function createNonFungibleCollection(
    collection: SimpleHash.LiteCollection,
): NonFungibleCollection<EthereumChainId, EthereumSchemaType> {
    const details = collection.collection_details;
    const chainId = resolveChainId(details.chains[0])!;

    const verifiedMarketplaces = details.marketplace_pages?.filter((x) => x.verified) || [];
    return {
        id: collection.collection_id,
        chainId,
        name: details.name || '',
        slug: details.name,
        schema: EthereumSchemaType.ERC721,
        balance: collection.distinct_nfts_owned,
        iconURL: details.image_url,
        ownersTotal: details.total_quantity,
        address: details.top_contracts?.[0]?.split('.')?.[1] ?? '',
        verified: verifiedMarketplaces.length > 0,
        verifiedBy: verifiedMarketplaces.map((x) => x.marketplace_name),
    };
}
