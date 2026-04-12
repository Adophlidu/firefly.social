import LinkIcon from '@dimensiondev/assets/link.svg';
import type { ReactNode } from 'react';

import { Link } from '@/components/Link.js';

interface DocumentCardProps {
    href: string;
    title: ReactNode;
    icon: ReactNode;
}

export function DocumentCard({ title, href, icon }: DocumentCardProps) {
    return (
        <Link
            href={href}
            target="_blank"
            className="shadow-primary dark:bg-bg inline-flex h-[48px] w-full items-center justify-start gap-2 rounded-lg bg-white px-3 py-2 backdrop-blur"
        >
            {icon}
            <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                <div className="text-medium text-main font-bold leading-[18px]">{title}</div>
            </div>
            <LinkIcon width={20} height={20} />
        </Link>
    );
}
