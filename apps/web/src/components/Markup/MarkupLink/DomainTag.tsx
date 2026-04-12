import { memo } from 'react';

import { AddressTag } from '@/components/Markup/MarkupLink/AddressTag.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { SearchType } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useEnsAddress } from '@/hooks/useEnsAddress.js';

interface DomainTagProps extends Omit<MarkupLinkProps, 'post'> {
    title: string;
}

export const DomainTag = memo<DomainTagProps>(function DomainTag({ title, ...rest }) {
    const { data: address } = useEnsAddress(title);
    if (!address)
        return (
            <Link
                onClick={stopPropagation}
                className="text-highlight hover:underline"
                href={resolveSearchUrl(title, SearchType.Profiles)}
            >
                {title}
            </Link>
        );

    return <AddressTag title={title} address={address} {...rest} />;
});
