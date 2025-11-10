import { memo } from 'react';

import { AddressTag } from '@/components/Markup/MarkupLink/AddressTag.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { useEnsAddress } from '@/hooks/useEnsAddress.js';

interface DomainTagProps extends Omit<MarkupLinkProps, 'post'> {
    title: string;
}

export const DomainTag = memo<DomainTagProps>(function DomainTag({ title, ...rest }) {
    const { data: address } = useEnsAddress(title);
    if (!address) return title;

    return <AddressTag title={title} address={address} {...rest} />;
});
