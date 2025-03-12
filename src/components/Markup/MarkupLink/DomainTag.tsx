import { memo } from 'react';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { useEnsAddress } from 'wagmi';

import { AddressTag } from '@/components/Markup/MarkupLink/AddressTag.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';

interface DomainTagProps extends Omit<MarkupLinkProps, 'post'> {
    title: string;
}

export const DomainTag = memo<DomainTagProps>(function DomainTag({ title, ...rest }) {
    const { data: address } = useEnsAddress({
        chainId: mainnet.id,
        name: normalize(title),
        blockTag: 'latest',
    });

    if (!address) return title;

    return <AddressTag title={title} address={address} {...rest} />;
});
