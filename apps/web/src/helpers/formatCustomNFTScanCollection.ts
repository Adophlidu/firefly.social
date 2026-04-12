import type { Collection } from '@/modals/NonFungibleCollectionSelectModal/CollectionItem.js';
import type { EVM } from '@/providers/nftscan/types.js';

export function formatCustomNFTScanCollection(collection: EVM.Collection, custom: boolean): Collection {
    return {
        chainId: +collection.chain_id,
        address: collection.contract_address,
        name: collection.name,
        iconURL: collection.logo_url || collection.large_image_url,
        id: collection.contract_address,
        custom,
    };
}
