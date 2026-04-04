import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { Image } from '@/esm/Image.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { type DetectedAddress } from '@/providers/types/Firefly.js';

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

    const attributes = detected?.contract_info?.attributes;
    const coingeckoCoinId = attributes?.coingecko_coin_id;
    const { data: token } = useTokenInfo({
        coingecko_id: coingeckoCoinId,
        address,
    });

    const url = useMemo(() => {
        if (collection) return resolveNFTUrl(collection.chain_id, collection.contract_address);
        if (token) {
            return resolveTokenPageUrl({ identity: coingeckoCoinId || address, chainId, isCoinId: !!coingeckoCoinId });
        }
        return BlockScanExplorerResolver.addressLink(chainId, address);
    }, [collection, token, coingeckoCoinId, address, chainId]);

    if (!url) return title;

    return (
        <span className="inline-flex h-[18px] items-center gap-1">
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
                className="text-highlight cursor-pointer hover:underline"
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
