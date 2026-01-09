import { type ReactNode } from 'react';

import { Link } from '@/components/Link.js';
import { stopPropagation } from '@/helpers/stopEvent.js';

interface ConditionalLinkProps {
    href: string | null;
    children: ReactNode;
    className: string;
    target?: string;
    onClick?: () => void;
}

export function ConditionalLink({ href, children, className, target, onClick }: ConditionalLinkProps) {
    return href ? (
        <Link
            href={href}
            onClick={(event) => {
                stopPropagation(event);
                onClick?.();
            }}
            className={className}
            target={target}
        >
            {children}
        </Link>
    ) : (
        <span className={className}>{children}</span>
    );
}
