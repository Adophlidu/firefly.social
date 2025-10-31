import { parseUrl } from '@firefly/utils';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { stopPropagation } from '@/helpers/stopEvent.js';

interface FootnoteLinkProps {
    href: string;
}

export const FootnoteLink = memo<FootnoteLinkProps>(function FootnoteLink({ href }) {
    const parsed = parseUrl(href);
    if (!parsed?.hostname) return null;

    return (
        <Link
            href={href}
            target="_blank"
            onClick={stopPropagation}
            className="ml-auto mt-1 flex justify-end text-sm text-secondary hover:underline"
        >
            {parsed.hostname}
        </Link>
    );
});
