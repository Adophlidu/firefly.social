'use client';

import RightArrowIcon from '@dimensiondev/assets/right-arrow.svg';
import { type ReactNode } from 'react';

import { Link } from '@/components/Link.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';

interface TextLinkProps {
    name: ReactNode;
    link: `/${string}`;
    relatedLinks?: Array<`/${string}`>;
}

export function TextLink({ name, link, relatedLinks }: TextLinkProps) {
    const pathname = usePathname();

    const matched =
        isRoutePathname(pathname, link) ||
        !!relatedLinks?.some((relatedLink) => isRoutePathname(pathname, relatedLink));

    return (
        <Link
            className={`border-line text-main mb-6 flex items-center justify-between border-b pb-1 text-[18px] leading-6 hover:font-bold ${
                matched ? 'font-bold' : 'font-normal'
            }`}
            key={link}
            href={link}
        >
            {name}
            <RightArrowIcon width={20} height={20} />
        </Link>
    );
}
