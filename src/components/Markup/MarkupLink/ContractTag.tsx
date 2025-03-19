import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { Image } from '@/esm/Image.js';
import { resolveNFTUrl, resolveNFTUrlByCollection } from '@/helpers/resolveNFTUrl.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import { useNFTDetail } from '@/hooks/useNFTDetail.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import type { DetectedAddress } from '@/providers/types/Firefly.js';

interface ContractTagProps {
    title: string;
    address: string;
    detected: DetectedAddress;
}

export const ContractTag = memo<ContractTagProps>(function ContractTag({ detected, address, title }) {
    const contractType = detected.contract_type;
    const isCollection = detected.address_type === 'contract' && ['ERC721', 'ERC1155', 'nft'].includes(contractType);
    const chainId = +detected.chain_id;

    const { data: collection } = useNFTCollection(address, chainId, isCollection);
    const { data: nft } = useNFTDetail(address, undefined, chainId);

    const attributes = detected?.contract_info?.attributes;
    const coingecko_coin_id = attributes?.coingecko_coin_id;
    const { data: token } = useTokenInfo(coingecko_coin_id || address, !!coingecko_coin_id);

    const url = useMemo(() => {
        if (collection) return resolveNFTUrlByCollection(collection.collection_id);
        if (nft) return resolveNFTUrl(chainId, address, nft?.id);
        if (token) return resolveTokenPageUrl(address, chainId);
        return BlockScanExplorerResolver.addressLink(chainId, address);
    }, [token, chainId, address, collection, nft]);

    if (!url) return title;

    return (
        <span className="inline-flex items-center gap-1">
            <Image
                className="inline size-[15px] shrink-0 rounded-full"
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
});
