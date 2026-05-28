'use client';

import { SORTED_SEARCH_TYPE, SORTED_SOCIAL_SOURCES } from '@dimensiondev/constants/computed';
import { type ClubType, SearchType, type SocialSource, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type JSX, memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { captureSearchPredictionsClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import {
    type SearchPredictionEventStatus,
    useSearchPredictionEventStatus,
} from '@/store/useSearchPredictionFilterStore.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

function fixSearchUrl(
    query: string,
    type: SearchType,
    source: Source,
    clubType: ClubType,
    eventsStatus?: SearchPredictionEventStatus,
) {
    let resolvedSource = source;
    if (!SORTED_SEARCH_TYPE[source as SocialSource]?.includes(type)) {
        resolvedSource = SORTED_SOCIAL_SOURCES.find((x) => SORTED_SEARCH_TYPE[x].includes(type)) ?? Source.Farcaster;
    }

    return resolveSearchUrl(query, type, resolvedSource, clubType, { eventsStatus });
}

export const SearchTabs = memo(function SearchTabs() {
    const pathname = usePathname();
    const { searchKeyword, searchType, source, clubType } = useSearchStateStore();
    const [eventStatus] = useSearchPredictionEventStatus();
    const predictionEventsStatus =
        searchType === SearchType.Prediction && eventStatus === 'resolved' ? eventStatus : undefined;

    const tabs = useMemo<Array<{ label: JSX.Element; link: string; onClick?: () => void }>>(() => {
        const isFromSearch = typeof searchKeyword === 'string' && searchKeyword.trim().startsWith('from:');

        if (isFromSearch) {
            return [
                {
                    label: <Trans>Posts</Trans>,
                    link: fixSearchUrl(searchKeyword, SearchType.Posts, source, clubType, predictionEventsStatus),
                },
            ];
        }

        return [
            {
                label: <Trans>Posts</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Posts, source, clubType, predictionEventsStatus),
            },
            {
                label: <Trans>Users</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Profiles, source, clubType, predictionEventsStatus),
            },
            {
                label: <Trans>Tokens</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Tokens, source, clubType, predictionEventsStatus),
            },
            {
                label: <Trans>Predictions</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Prediction, source, clubType, predictionEventsStatus),
                onClick: captureSearchPredictionsClick,
            },
            {
                label: <Trans>Clubs</Trans>,
                link: fixSearchUrl(searchKeyword, SearchType.Clubs, source, clubType, predictionEventsStatus),
            },
        ];
    }, [source, searchKeyword, clubType, predictionEventsStatus]);

    return (
        <nav className="no-scrollbar flex w-full gap-x-4 overflow-x-auto border-b border-line bg-primaryBottom px-4">
            {tabs.map((tab) => {
                const isActive = isRoutePathname(pathname, tab.link.split('?')[0] as `/${string}`);

                return (
                    <Link
                        key={tab.link}
                        className={classNames(
                            'h-[45px] whitespace-nowrap border-b-4 font-bold leading-[45px] transition-all',
                            {
                                'border-transparent text-third': !isActive,
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
