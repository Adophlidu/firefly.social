import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { AddressSocialAvatar } from '@/components/AddressSocialAvatar/index.js';
import { Link } from '@/components/Link.js';
import { ContractTag } from '@/components/Markup/MarkupLink/ContractTag.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { Source } from '@/constants/enum.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

interface AddressTagProps extends Omit<MarkupLinkProps, 'post'> {
    title: string;
    address: string;
}
export const AddressTag = memo<AddressTagProps>(function AddressTag({ title, address }) {
    const { data, isLoading } = useQuery({
        queryKey: ['detect-address', address],
        queryFn: () => FireflyEndpointProvider.detectAddress(address),
        select: (data) => data.list[0],
    });

    if (!data || isLoading) return title;

    switch (data.address_type) {
        case 'eoa':
        case 'soa':
            return (
                <span className="inline-flex h-[18px] items-center gap-1">
                    <AddressSocialAvatar
                        className="inline size-[15px] shrink-0 rounded-full"
                        address={address}
                        size={15}
                    />
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
            if (!data) return title;
            return <ContractTag title={title} address={address} detected={data} />;
        default:
            safeUnreachable(data.address_type);
            return title;
    }
});
