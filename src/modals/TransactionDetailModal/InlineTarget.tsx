import { type ReactNode } from 'react';

import { Link } from '@/components/Link.js';
import { classNames } from '@/helpers/classNames.js';

export interface InlineTargetProps {
    href: string;
    logo?: ReactNode;
    text: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function InlineTarget({ href, logo, text, className, onClick }: InlineTargetProps) {
    return (
        <Link href={href} className={classNames('flex items-center gap-x-1', className)} onClick={onClick}>
            {logo}
            <span className="text-sm font-semibold leading-[18px]">{text}</span>
        </Link>
    );
}
