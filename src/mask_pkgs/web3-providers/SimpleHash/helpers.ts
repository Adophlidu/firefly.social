import { memoize } from 'lodash-es';
import { SourceType, type NonFungibleCollection } from '@masknet/web3-shared-base';
import { ChainId, SchemaType } from '@masknet/web3-shared-evm';
import { ChainId as SolanaChainId } from '@masknet/web3-shared-solana';
import { NetworkPluginID } from '@/constants/enum.js';
import type { Web3Helper } from '@masknet/web3-helpers';
import { SIMPLE_HASH_URL } from './constants.js';
import { fetchSquashedJSON } from '../helpers/fetchJSON.js';
import { queryClient } from '../helpers/queryClient.js';
import type { SimpleHash } from '../types/SimpleHash.js';

export async function fetchFromSimpleHash<T>(path: string, init?: RequestInit) {
    return queryClient.fetchQuery<T>({
        queryKey: ['simple-hash', path],
        staleTime: 10_000,
        queryFn: async () => {
            return fetchSquashedJSON<T>(`${SIMPLE_HASH_URL}${path}`, {
                method: 'GET',
                mode: 'cors',
                headers: { 'content-type': 'application/json' },
            });
        },
    });
}

export function createNonFungibleCollection(
    collection: SimpleHash.Collection,
): NonFungibleCollection<ChainId, SchemaType> {
    const chainId = resolveChainId(collection.chain)!;

    const verifiedMarketplaces = collection.marketplace_pages?.filter((x) => x.verified) || [];
    return {
        id: collection.id,
        chainId,
        name: collection.name || '',
        slug: collection.name,
        schema: SchemaType.ERC721,
        balance: collection.distinct_nfts_owned,
        iconURL: collection.image_url,
        ownersTotal: collection.total_quantity,
        source: SourceType.SimpleHash,
        address: collection.top_contracts?.[0]?.split('.')?.[1] ?? '',
        verified: verifiedMarketplaces.length > 0,
        verifiedBy: verifiedMarketplaces.map((x) => x.marketplace_name),
    };
}

export const resolveChainId: (chainId: string) => ChainId | undefined = memoize(function resolveChainId(
    chain: string,
): ChainId | undefined {
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
});

const ChainNameMap: Record<NetworkPluginID, Record<number, string>> = {
    [NetworkPluginID.PLUGIN_EVM]: {
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
    [NetworkPluginID.PLUGIN_SOLANA]: {
        [SolanaChainId.Mainnet]: 'solana',
    },
};

export function getAllChainNames(pluginID: NetworkPluginID) {
    return Object.values(ChainNameMap[pluginID]).join(',');
}

export function resolveChain(pluginId: NetworkPluginID, chainId: Web3Helper.ChainIdAll): string | undefined {
    return ChainNameMap[pluginId][chainId];
}

export function isLensFollower(name: string) {
    if (!name) return false;
    return name.endsWith('.lens-Follower');
}
