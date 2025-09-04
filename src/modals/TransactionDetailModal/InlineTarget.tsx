import { type ReactNode } from 'react';

import { Link } from '@/components/Link.js';
import { classNames } from '@/helpers/classNames.js';

export interface InlineTargetProps {
    href: string;
    logo?: ReactNode;
    text: ReactNode;
    className?: string;
}

export function InlineTarget({ href, logo, text, className }: InlineTargetProps) {
    return (
        <Link href={href} className={classNames('flex items-center gap-x-1', className)}>
            {logo}
            <span className="text-xs leading-[12px]">{text}</span>
        </Link>
    );
}
