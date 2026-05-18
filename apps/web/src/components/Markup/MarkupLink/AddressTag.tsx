import { Source } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { ContractTag } from '@/components/Markup/MarkupLink/ContractTag.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { Image } from '@/esm/Image.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';

interface AddressTagProps extends Omit<MarkupLinkProps, 'post'> {
    title: string;
    address: string;
}

export const AddressTag = memo<AddressTagProps>(function AddressTag({ title, address }) {
    const isDomain = ['.eth', '.sol', '.skr'].some((t) => title.endsWith(t));

    const { data, isLoading } = useQuery({
        queryKey: ['detect-address', address.toLowerCase()],
        queryFn: () => fireflyWalletProvider.detectAddress(address),
        enabled: !isDomain,
        select: (data) => data?.list[0],
    });

    if ((!data || isLoading) && !isDomain) return title;

    const addressType = data?.address_type;

    if (addressType === 'eoa' || addressType === 'soa' || isDomain) {
        return (
            <span className="inline-flex h-[18px] items-center gap-1">
                <Image
                    className="inline size-[15px] shrink-0 rounded-full"
                    unoptimized
                    loading="lazy"
                    src={getStampAvatarByProfileId(Source.Wallet, isDomain ? title : address)}
                    alt=""
                    width={15}
                    height={15}
                />
                <Link
                    className="text-highlight cursor-pointer hover:underline"
                    onClick={stopPropagation}
                    prefetch={false}
                    href={getProfileUrl({ source: Source.Wallet, profileId: address })}
                >
                    {title}
                </Link>
            </span>
        );
    }
    if (addressType === 'contract') {
        if (!data) return title;
        return <ContractTag title={title} address={address} detected={data} />;
    }
    return title;
});
