import { resolveSimpleHashChainId } from '@/helpers/resolveSimpleHashChain.js';
import type { Collection } from '@/modals/NonFungibleCollectionSelectModal/CollectionItem.js';
import type { SimpleHash } from '@/providers/simplehash/type.js';

export function formatCustomSimpleHashCollection(collection: SimpleHash.Collection): Collection {
    const [chain, address] = collection.top_contracts[0]?.split('.');
    return {
        chainId: resolveSimpleHashChainId(chain)!,
        address,
        name: collection.name,
        iconURL: collection.image_url,
        id: address,
        custom: true,
    };
}
