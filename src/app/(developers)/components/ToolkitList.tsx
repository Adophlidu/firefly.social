'use client';

import RightArrowIcon from '@/assets/right-arrow.svg';
import { Link } from '@/components/Link.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';

export function ToolkitList() {
    const pathname = usePathname();

    return (
        <div className="flex min-h-full min-w-full flex-col p-6 md:min-w-[280px] md:border-r md:border-line">
            <div className="pb-6 text-[20px] font-bold leading-[24px] text-lightMain">Developers</div>
            {[
                { name: 'General', link: '/general' },
                { name: 'Telemetry', link: '/telemetry' },
                { name: 'Firefly Bridge', link: '/bridge' },
                { name: 'Ethereum JSON RPC', link: '/ethereum' },
                { name: 'Session Validator', link: '/session' },
                { name: 'Blink Validator', link: '/blink' },
                { name: 'Frame Validator', link: '/frame' },
                { name: 'OpenGraph Validator', link: '/og' },
                { name: 'LinkDigest Validator', link: '/digestLink' },
            ].map(({ name, link }) => (
                <Link
                    className={`mb-6 flex items-center justify-between border-b border-line pb-1 text-[18px] leading-[24px] text-main hover:font-bold ${
                        isRoutePathname(pathname, `/developers${link}`) ? 'font-bold' : 'font-normal'
                    }`}
                    key={link}
                    href={`/developers${link}`}
                >
                    {name} <RightArrowIcon width={20} height={20} />
                </Link>
            ))}
        </div>
    );
}
