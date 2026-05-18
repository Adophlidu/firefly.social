'use client';

import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type JSX, memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { SORTED_SEARCH_TYPE, SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { type ClubType, SearchType } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { captureSearchPredictionsClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

function fixSearchUrl(query: string, type: SearchType, source: Source, clubType: ClubType) {
    let resolvedSource = source;
    if (!SORTED_SEARCH_TYPE[source as SocialSource]?.includes(type)) {
        resolvedSource = SORTED_SOCIAL_SOURCES.find((x) => SORTED_SEARCH_TYPE[x].includes(type)) ?? Source.Farcaster;
    }

    return resolveSearchUrl(query, type, resolvedSource, clubType);
}

export const SearchTabs = memo(function SearchTabs() {
    const pathname = usePathname();
    const { searchKeyword, source, clubType } = useSearchStateStore();

    const tabs = useMemo<Array<{ label: JSX.Element; link: string; onClick?: () => void }>>(() => {
        const isFromSearch = typeof searchKeyword === 'string' && searchKeyword.trim().startsWith('from:');

        if (isFromSearch) {
            return [
                {
                    label: <Trans>Posts</Trans>,
                    link: fixSearchUrl(searchKeyword, SearchType.Posts, source, clubType),
                },
            ];
        }

        return [
            {
                label: <Trans>Posts</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Posts, source, clubType),
            },
            {
                label: <Trans>Users</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Profiles, source, clubType),
            },
            {
                label: <Trans>Tokens</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Tokens, source, clubType),
            },
            {
                label: <Trans>Predictions</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Prediction, source, clubType),
                onClick: captureSearchPredictionsClick,
            },
            {
                label: <Trans>Clubs</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Clubs, source, clubType),
            },
        ];
    }, [source, searchKeyword, clubType]);

    return (
        <nav className="no-scrollbar border-line bg-primaryBottom flex w-full gap-x-4 overflow-x-auto border-b px-4">
            {tabs.map((tab) => {
                const isActive = isRoutePathname(pathname, tab.link.split('?')[0] as `/${string}`);

                return (
                    <Link
                        key={tab.link}
                        className={classNames(
                            'h-[45px] whitespace-nowrap border-b-4 font-bold leading-[45px] transition-all',
                            {
                                'text-third border-transparent': !isActive,
                                'border-highlight text-highlight': isActive,
                            },
                        )}
                        href={tab.link}
                        onClick={tab.onClick}
                    >
                        <span className="px-2 md:px-4">{tab.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
});
