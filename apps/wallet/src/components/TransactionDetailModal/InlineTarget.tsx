import { Link } from '@tanstack/react-router';
import type { MouseEvent, ReactNode } from 'react';

import { cn } from '@/lib/utils.js';

export interface InlineTargetProps {
    href: string;
    logo?: ReactNode;
    text: ReactNode;
    className?: string;
    onClick?: () => void;
    onNavigate?: (href: string) => void;
}

function shouldHandleNavigation(event: MouseEvent<HTMLAnchorElement>) {
    return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !event.metaKey &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.shiftKey
    );
}

export function InlineTarget({ href, logo, text, className, onClick, onNavigate }: InlineTargetProps) {
    return (
        <Link
            to={href}
            className={cn('flex items-center gap-x-1', className)}
            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                onClick?.();
                if (!onNavigate || !href || !shouldHandleNavigation(event)) return;
                event.preventDefault();
                onNavigate(href);
            }}
        >
            {logo}
            <span className="text-sm font-semibold leading-[18px]">{text}</span>
        </Link>
    );
}
