import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { AddressSocialAvatar } from '@/components/AddressSocialAvatar/index.js';
import { isAvailableAddress } from '@/components/EmbedCards/helpers.js';
import { Link } from '@/components/Link.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { Source } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

interface AddressTagProps extends Omit<MarkupLinkProps, 'post'> {
    title: string;
}
export const AddressTag = memo<AddressTagProps>(function AddressTag({ title: address }) {
    const { data, isLoading } = useQuery({
        queryKey: ['detect-address', address],
        queryFn: () => FireflyEndpointProvider.detectAddress(address),
        select: (data) => data.list.filter(isAvailableAddress)[0],
    });
    if (!data || isLoading) return address;

    switch (data.address_type) {
        case 'eoa':
        case 'soa':
            return (
                <span className="inline-flex items-center gap-1">
                    <AddressSocialAvatar className="inline rounded-full" address={address} size={15} />
                    <Link
                        className="cursor-pointer text-highlight hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        prefetch={false}
                        href={resolveProfileUrl(Source.Wallet, address)}
                    >
                        {address}
                    </Link>
                </span>
            );
        case 'contract':
            return (
                <span className="inline-flex items-center gap-1">
                    <Image
                        className="inline rounded-full"
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
                        href={resolveTokenPageUrl(address, undefined)}
                    >
                        {address}
                    </Link>
                </span>
            );
        default:
            safeUnreachable(data.address_type);
            return null;
    }
});
