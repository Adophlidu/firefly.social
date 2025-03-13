import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { AddressSocialAvatar } from '@/components/AddressSocialAvatar/index.js';
import { isAvailableAddress } from '@/components/EmbedCards/helpers.js';
import { Link } from '@/components/Link.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { Source } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { resolveNFTUrl, resolveNFTUrlByCollection } from '@/helpers/resolveNFTUrl.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import { useNFTDetail } from '@/hooks/useNFTDetail.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

interface AddressTagProps extends Omit<MarkupLinkProps, 'post'> {
    title: string;
    address: string;
}
export const AddressTag = memo<AddressTagProps>(function AddressTag({ title, address }) {
    const { data, isLoading } = useQuery({
        queryKey: ['detect-address', address],
        queryFn: () => FireflyEndpointProvider.detectAddress(address),
        select: (data) => data.list.filter(isAvailableAddress)[0],
    });
    const isNFTCollection = data
        ? data.address_type === 'contract' && ['ERC721', 'ERC1155', 'nft'].includes(data.contract_type)
        : false;
    const chainId = data?.chain_id ? +data.chain_id : undefined;

    const { data: collection, isLoading: isLoadingCollection } = useNFTCollection(address, chainId, isNFTCollection);
    const { data: nft, isLoading: isLoadingNFT } = useNFTDetail(address, undefined, chainId);

    if (!data || isLoading) return title;

    switch (data.address_type) {
        case 'eoa':
        case 'soa':
            return (
                <span className="inline-flex items-center gap-1">
                    <AddressSocialAvatar className="inline shrink-0 rounded-full" address={address} size={15} />
                    <Link
                        className="cursor-pointer text-highlight hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        prefetch={false}
                        href={resolveProfileUrl(Source.Wallet, address)}
                    >
                        {title}
                    </Link>
                </span>
            );
        case 'contract':
            if (isLoadingCollection && isLoadingNFT) return title;
            return (
                <span className="inline-flex items-center gap-1">
                    <Image
                        className="inline shrink-0 rounded-full"
                        unoptimized
                        alt=""
                        loading="lazy"
                        src={`https://stamp.firefly.land/logo/${address}?s=300`}
                        width={15}
                        height={15}
                    />
                    <Link
                        className="cursor-pointer text-highlight hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        prefetch={false}
                        href={
                            collection
                                ? resolveNFTUrlByCollection(collection.collection_id)
                                : resolveNFTUrl(chainId || '', address, nft?.id)
                        }
                    >
                        {title}
                    </Link>
                </span>
            );
        default:
            safeUnreachable(data.address_type);
            return null;
    }
});
