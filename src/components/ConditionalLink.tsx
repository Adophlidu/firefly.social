import type { ReactNode } from 'react';

import { Link } from '@/components/Link.js';
import { stopPropagation } from '@/helpers/stopEvent.js';

interface ConditionalLinkProps {
    href: string | null;
    children: ReactNode;
    className: string;
    target?: string;
}

export function ConditionalLink({ href, children, className, target }: ConditionalLinkProps) {
    return href ? (
        <Link href={href} onClick={stopPropagation} className={className} target={target}>
            {children}
        </Link>
    ) : (
        <span className={className}>{children}</span>
    );
}
