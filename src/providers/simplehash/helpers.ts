import { ChainRuntime } from '@/constants/enum.js';
import { ChainId, SchemaType } from '@/mask_pkgs/web3-shared/evm/index.js';
import { ChainId as SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';
import type { SimpleHash } from '@/providers/simplehash/type.js';
import type { NonFungibleCollection } from '@masknet/web3-shared-base';

const ChainNameMap: Record<ChainRuntime, Record<number, string>> = {
    [ChainRuntime.Ethereum]: {
        [ChainId.Mainnet]: 'ethereum',
        [ChainId.BSC]: 'bsc',
        [ChainId.Polygon]: 'polygon',
        [ChainId.Arbitrum]: 'arbitrum',
        [ChainId.Optimism]: 'optimism',
        [ChainId.Avalanche]: 'avalanche',
        [ChainId.xDai]: 'gnosis',
        [ChainId.Base]: 'base',
        [ChainId.Scroll]: 'scroll',
        [ChainId.Celo]: 'celo',
        [ChainId.Zora]: 'zora',
        [ChainId.ZkSyncEra]: 'zksync-era',
        [ChainId.Linea]: 'linea',
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

function resolveChainId(chain: string): ChainId | undefined {
    // Some of the `chainResolver.chainId()` results do not match.
    switch (chain) {
        case 'ethereum':
            return ChainId.Mainnet;
        case 'polygon':
            return ChainId.Polygon;
        case 'arbitrum':
            return ChainId.Arbitrum;
        case 'optimism':
            return ChainId.Optimism;
        case 'avalanche':
            return ChainId.Avalanche;
        case 'gnosis':
            return ChainId.xDai;
        case 'bsc':
            return ChainId.BSC;
        case 'base':
            return ChainId.Base;
        case 'scroll':
            return ChainId.Scroll;
        case 'celo':
            return ChainId.Celo;
        case 'zora':
            return ChainId.Zora;
        case 'zksync-era':
            return ChainId.ZkSyncEra;
        case 'linea':
            return ChainId.Linea;
        default:
            return undefined;
    }
}

export function createNonFungibleCollection(
    collection: SimpleHash.LiteCollection,
): NonFungibleCollection<ChainId, SchemaType> {
    const details = collection.collection_details;
    const chainId = resolveChainId(details.chains[0])!;

    const verifiedMarketplaces = details.marketplace_pages?.filter((x) => x.verified) || [];
    return {
        id: collection.collection_id,
        chainId,
        name: details.name || '',
        slug: details.name,
        schema: SchemaType.ERC721,
        balance: collection.distinct_nfts_owned,
        iconURL: details.image_url,
        ownersTotal: details.total_quantity,
        address: details.top_contracts?.[0]?.split('.')?.[1] ?? '',
        verified: verifiedMarketplaces.length > 0,
        verifiedBy: verifiedMarketplaces.map((x) => x.marketplace_name),
    };
}
