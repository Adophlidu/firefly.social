import { SourceType, type NonFungibleCollection } from '@masknet/web3-shared-base';
import { ChainId, SchemaType } from '@masknet/web3-shared-solana';
import { type SimpleHash } from '../types/SimpleHash.js';

export function createSolanaNonFungibleCollection(
    collection: SimpleHash.Collection,
): NonFungibleCollection<ChainId, SchemaType> {
    const chainId = resolveSolanaChainId(collection.chain)!;

    const verifiedMarketplaces = collection.marketplace_pages?.filter((x) => x.verified) || [];
    return {
        id: collection.id,
        chainId,
        name: collection.name || '',
        slug: collection.name,
        schema: SchemaType.NonFungible,
        balance: collection.distinct_nfts_owned,
        iconURL: collection.image_url,
        ownersTotal: collection.total_quantity,
        source: SourceType.SimpleHash,
        address: collection.top_contracts?.[0]?.split('.')?.[1] ?? '',
        verified: verifiedMarketplaces.length > 0,
        verifiedBy: verifiedMarketplaces.map((x) => x.marketplace_name),
    };
}

export function resolveSolanaChainId(chain: string): ChainId | undefined {
    // Some of the `chainResolver.chainId()` results do not match.
    switch (chain) {
        case 'solana':
            return ChainId.Mainnet;
        default:
            return undefined;
    }
}
