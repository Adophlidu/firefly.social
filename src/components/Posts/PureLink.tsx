import { first } from 'lodash-es';

import PureLinkIcon from '@/assets/pure-link.svg';
import { Link } from '@/components/Link.js';
import { classNames } from '@/helpers/classNames.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { stopPropagation } from '@/helpers/stopEvent.js';

interface PureLinkProps {
    url: string;
    title?: string;
    description?: string;
    className?: string;
}

export function PureLink({ url, title, description, className }: PureLinkProps) {
    const domain = parseUrl(url)?.hostname;
    const siteTitle = title || first(domain?.split('.'));

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
                {siteTitle ? (
                    <h1 className="line-clamp-2 max-w-full text-base font-semibold text-main first-letter:uppercase">
                        {siteTitle}
                    </h1>
                ) : null}
                {description ? (
                    <div className="line-clamp-1 max-w-full text-sm font-normal text-second">{description}</div>
                ) : null}
                <div className="line-clamp-1 max-w-full text-sm font-medium text-highlight">{domain || url}</div>
            </div>
        </Link>
    );
}
