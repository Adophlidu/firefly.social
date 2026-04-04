import LinkIcon from '@dimensiondev/assets/link.svg';
import { type FunctionComponent, type ReactNode, type SVGAttributes } from 'react';

import { Link } from '@/components/Link.js';

interface LinkCardProps {
    title: ReactNode;
    link: string;
    logo: FunctionComponent<SVGAttributes<SVGElement>>;
}

export function LinkCard({ title, link, logo: Icon }: LinkCardProps) {
    return (
        <Link
            href={link}
            className="shadow-primary dark:bg-bg inline-flex h-[48px] w-full items-center justify-start gap-2 rounded-lg bg-white px-3 py-2 backdrop-blur"
            target="_blank"
        >
            <Icon width={24} height={24} />
            <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                <div className="text-medium text-main font-bold leading-[18px]">{title}</div>
            </div>
            <LinkIcon width={20} height={20} />
        </Link>
    );
}
