import { safeUnreachable } from '@masknet/kit';
import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { Image } from '@/esm/Image.js';
import { resolveNFTUrl, resolveNFTUrlByCollection } from '@/helpers/resolveNFTUrl.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import { useNFTDetail } from '@/hooks/useNFTDetail.js';
import type { DetectedAddress } from '@/providers/types/Firefly.js';

interface ContractTagProps {
    title: string;
    address: string;
    detected: DetectedAddress;
}

export const ContractTag = memo<ContractTagProps>(function ContractTag({ detected, address, title }) {
    const isNFTCollection =
        detected.address_type === 'contract' && ['ERC721', 'ERC1155', 'nft'].includes(detected.contract_type);
    const chainId = +detected.chain_id;

    const { data: collection } = useNFTCollection(address, chainId, isNFTCollection);
    const { data: nft } = useNFTDetail(address, undefined, chainId);

    const url = useMemo(() => {
        if (isNFTCollection) {
            return collection
                ? resolveNFTUrlByCollection(collection.collection_id)
                : resolveNFTUrl(detected.chain_id, address, nft?.id);
        }
        return resolveTokenPageUrl(address, detected.chain_id);
    }, [address, collection, detected.chain_id, isNFTCollection, nft?.id]);

    switch (detected.contract_type) {
        case 'token':
        case 'ERC20':
        case 'ERC721':
        case 'ERC1155':
        case 'nft':
            return (
                <span className="inline-flex items-center gap-1">
                    <Image
                        className="inline shrink-0 rounded-full"
                        unoptimized
                        alt=""
                        loading="lazy"
                        src={`https://stamp.firefly.land/logo/${address}`}
                        width={15}
                        height={15}
                    />
                    <Link
                        className="cursor-pointer text-highlight hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        prefetch={false}
                        href={url}
                    >
                        {title}
                    </Link>
                </span>
            );

        case 'unknown':
        case 'program':
            return title;
        default:
            safeUnreachable(detected.contract_type);
    }
    return title;
});
