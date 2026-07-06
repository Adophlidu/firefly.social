import PureLinkIcon from '@dimensiondev/assets/pure-link.svg';
import { classNames, parseUrl } from '@dimensiondev/utils';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { stopPropagation } from '@/helpers/stopEvent.js';

interface PureLinkProps {
    url: string;
    title?: string | null;
    description?: string | null;
    className?: string;
}

export const PureLink = memo<PureLinkProps>(function PureLink({ url, title, description, className }) {
    const domain = parseUrl(url)?.hostname;

    return (
        <Link
            href={url}
            target="_blank"
            onClick={stopPropagation}
            rel="nofollow noopener noreferrer"
            className={classNames(
                'flex h-[120px] gap-4 overflow-hidden rounded-2xl border border-secondaryLine',
                className,
            )}
        >
            <div className="flex aspect-square h-full shrink-0 items-center justify-center bg-lightBg">
                <PureLinkIcon width={56} height={56} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1 pr-4">
                {title ? (
                    <h1 className="line-clamp-2 max-w-full text-base font-semibold text-main first-letter:uppercase">
                        {title}
                    </h1>
                ) : null}
                {description ? (
                    <div className="line-clamp-1 max-w-full text-sm font-normal text-second">{description}</div>
                ) : null}
                <div className="line-clamp-1 max-w-full text-sm font-medium text-highlight">{domain}</div>
            </div>
        </Link>
    );
});
