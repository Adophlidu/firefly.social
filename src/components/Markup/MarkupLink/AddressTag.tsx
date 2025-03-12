import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { AddressSocialAvatar } from '@/components/AddressSocialAvatar/index.js';
import { isAvailableAddress } from '@/components/EmbedCards/helpers.js';
import { Link } from '@/components/Link.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { Source } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
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
            const isNFT = ['ERC721', 'ERC1155', 'nft'].includes(data.contract_type);
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
                        href={isNFT ? resolveNFTUrl(address, data.chain_id) : resolveTokenPageUrl(address, undefined)}
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
