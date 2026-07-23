'use client';

import { classNames, parseUrl } from '@dimensiondev/utils';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import type { LinkProps } from 'next/link.js';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { formatUrl } from '@/helpers/formatUrl.js';
import { isSelfReference } from '@/helpers/isLinkMatchingHost.js';
import { isTopLevelDomain } from '@/helpers/isTopLevelDomain.js';
import { stopPropagation } from '@/helpers/stopEvent.js';

interface ExternalLinkProps extends Omit<LinkProps, 'href'> {
    title: string;
    className?: string;
    showExternalIcon?: boolean;
}

export const ExternalLink = memo<ExternalLinkProps>(function ExternalLink({
    title,
    className,
    showExternalIcon = false,
}) {
    if (!title) return null;

    const u = parseUrl(title);
    if (!u || !isTopLevelDomain(u)) return <span>{title}</span>;

    return (
        <Link
            onClick={stopPropagation}
            href={u.href}
            title={u.href}
            className={classNames('text-highlight', className, {
                'hover:underline': !!u,
            })}
            target={!isSelfReference(u.href) ? '_blank' : '_self'}
        >
            {title ? formatUrl(title, 30) : title}
            {showExternalIcon ? (
                <ArrowUpRightIcon aria-hidden className="ml-0.5 inline-block size-3 align-baseline" />
            ) : null}
        </Link>
    );
});
