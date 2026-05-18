import GhostHoleIcon from '@dimensiondev/assets/ghost.svg';
import type { Source } from '@dimensiondev/enums';
import type { ReactNode } from 'react';

import { Comeback } from '@/components/Comeback.js';
import { Link } from '@/components/Link.js';
import type { SearchType } from '@/constants/enum.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';

interface NotFoundProps {
    text?: ReactNode;
    backText?: ReactNode;
    search?: {
        text: ReactNode;
        searchType: SearchType;
        searchText: string;
        source?: Source;
    };
}

export function NotFound({ text, backText, search }: NotFoundProps) {
    return (
        <>
            {backText ? (
                <div className="border-line bg-primaryBottom sticky top-0 z-30 flex h-[60px] items-center justify-between border-b px-4">
                    <div className="flex items-center gap-7">
                        <Comeback />
                        <span className="text-lightMain text-xl font-black">{backText}</span>
                    </div>
                </div>
            ) : null}
            <div className="text-secondary flex flex-col items-center py-12">
                <GhostHoleIcon width={200} height={143} className="text-third" />
                <div className="mt-3 break-all text-center font-bold">
                    {text ? <div className="mt-10 text-sm">{text}</div> : null}
                    {search ? (
                        <Link
                            className="border-main text-medium text-main mt-3 flex h-10 items-center justify-center rounded-full border px-5 transition-all hover:opacity-80"
                            href={resolveSearchUrl(search.searchText, search.searchType, search.source)}
                        >
                            {search.text}
                        </Link>
                    ) : null}
                </div>
            </div>
        </>
    );
}
