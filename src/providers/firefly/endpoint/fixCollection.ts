import type { EVM } from '@/providers/nft-scan/types.js';

export function fixCollection(collection: EVM.Collection): EVM.Collection {
    return {
        ...collection,
        chain_id: +collection.chain_id,
    };
}
