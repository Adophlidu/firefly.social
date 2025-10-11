import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { Link } from '@/esm/Link.js';

interface ShowMoreLinkProps {
    href: string;
}

export const ShowMoreLink = memo<ShowMoreLinkProps>(function ShowMoreLink({ href }) {
    return (
        <div className="pb-[18px] text-center">
            <Link href={href} className="h-6 text-xs font-bold text-highlight">
                <Trans>Show more</Trans>
            </Link>
        </div>
    );
});
