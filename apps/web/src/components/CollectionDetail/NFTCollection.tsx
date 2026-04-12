import { CollectionInfo } from '@/components/CollectionDetail/CollectionInfo.js';
import { CollectionTabs } from '@/components/CollectionDetail/CollectionTabs.js';
import { NFTNavbar } from '@/components/NFTs/NFTNavbar.js';
import type { EVM } from '@/providers/nftscan/types.js';

interface NFTCollectionProps {
    collection: EVM.Collection;
    address?: string;
    chainId: number;
}

export function NFTCollection({ collection, ...rest }: NFTCollectionProps) {
    const address = rest.address ?? collection.contract_address;
    const chainId = rest.chainId ?? collection.chain_id;

    return (
        <div className="min-h-screen">
            <NFTNavbar>{collection.name}</NFTNavbar>
            <CollectionInfo
                chainId={chainId}
                address={address}
                name={collection.name}
                bannerImageUrl={collection.banner_url || collection.featured_url}
                logoUrl={collection.logo_url || collection.large_image_url}
                nftCount={collection.amounts_total}
                ownerCount={collection.owners_total}
                externalUrl={collection.website}
            />
            <CollectionTabs chainId={chainId} address={address} />
        </div>
    );
}
