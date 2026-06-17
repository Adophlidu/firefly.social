'use client';

import SearchIcon from '@dimensiondev/assets/search.svg';
import type { Source } from '@dimensiondev/enums';
import { PageRoute, SearchType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { isValidAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useDebounceValue } from 'usehooks-ts';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ClearButton } from '@/components/IconButton.js';
import { Link } from '@/components/Link.js';
import { SuggestProfileList } from '@/components/Search/SuggestProfileList.js';
import { SuggestTokenList } from '@/components/Search/SuggestTokenList.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveSearchTypeFromQuery } from '@/helpers/resolveSearchTypeFromQuery.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { resolveSearchUrlType, SearchUrlKind } from '@/helpers/resolveSearchUrlType.js';
import { useSearchHistoryStateStore } from '@/store/useSearchHistoryStore.js';
import {
    type SearchPredictionEventStatus,
    useSearchPredictionEventStatus,
} from '@/store/useSearchPredictionFilterStore.js';
import { type SearchState, useSearchStateStore } from '@/store/useSearchStore.js';

interface SearchRecommendationProps {
    keyword: string;
    fullScreen?: boolean;
    autoSearchType?: boolean;
    onSearch?: (state: SearchState) => void;
    onSelect?: () => void;
    onClear?: () => void;
}

function fixSearchUrl(
    isBasicSearch: boolean,
    query: string,
    searchType: SearchType,
    source: Source,
    eventsStatus?: SearchPredictionEventStatus,
) {
    // Always check if the query is a URL first
    const urlResult = resolveSearchUrlType(query);
    if (urlResult && urlResult.kind !== SearchUrlKind.FireflyInternal) {
        return resolveSearchUrl(query, urlResult.searchType, urlResult.source, undefined, {
            eventsStatus: urlResult.searchType === SearchType.Prediction ? eventsStatus : undefined,
        });
    }

    // If not a URL, use the original logic
    if (isBasicSearch) {
        return resolveSearchUrl(query, resolveSearchTypeFromQuery(query));
    }

    return resolveSearchUrl(query, searchType, source, undefined, {
        eventsStatus: searchType === SearchType.Prediction ? eventsStatus : undefined,
    });
}

function getSearchUrlForRecord(
    record: string,
    autoSearchType: boolean,
    isSearchPage: boolean,
    searchType: SearchType,
    source: Source,
    eventsStatus?: SearchPredictionEventStatus,
) {
    // Always check if the record is a URL first
    const urlResult = resolveSearchUrlType(record);
    if (urlResult && urlResult.kind !== SearchUrlKind.FireflyInternal) {
        return resolveSearchUrl(record, urlResult.searchType, urlResult.source, undefined, {
            eventsStatus: urlResult.searchType === SearchType.Prediction ? eventsStatus : undefined,
        });
    }

    if (isSearchPage && searchType === SearchType.Prediction) {
        return resolveSearchUrl(record, searchType, source, undefined, { eventsStatus });
    }

    // If not a URL, use the original logic
    if (autoSearchType && !isSearchPage) {
        return resolveSearchUrl(record, resolveSearchTypeFromQuery(record));
    }

    return fixSearchUrl(isSearchPage, record, searchType, source, eventsStatus);
}

export function SearchRecommendation(props: SearchRecommendationProps) {
    const { keyword, fullScreen = false, autoSearchType, onSearch, onSelect, onClear } = props;
    const pathname = usePathname();
    const isSearchPage = isRoutePathname(pathname, PageRoute.Search);
    const { searchType, source } = useSearchStateStore();
    const [eventStatus] = useSearchPredictionEventStatus();
    const predictionEventsStatus =
        searchType === SearchType.Prediction && eventStatus === 'resolved' ? eventStatus : undefined;

    const { records, addRecord, removeRecord, clearAll } = useSearchHistoryStateStore();

    const [debouncedKeyword] = useDebounceValue(keyword, 300);

    if (!records.length && !keyword) return null;

    const containerClasses = classNames(
        'max:max-h-[calc(100vh-59px)] absolute -inset-x-px top-10 z-[1000] flex w-full flex-col overflow-auto bg-white dark:border dark:border-line dark:bg-primaryBottom',
        {
            'mt-2 rounded-2xl shadow-[0_4px_30px_0_rgba(0,0,0,0.1)]': !fullScreen,
            'bottom-0 mt-3 h-[calc(100vh-40px)] border-none': fullScreen,
        },
    );

    const isSymbol = debouncedKeyword?.startsWith('$');
    if (keyword) {
        return (
            <div className={containerClasses}>
                <div
                    className="relative mb-4 mt-3 flex cursor-pointer items-center gap-3 px-3 text-left hover:bg-bg"
                    onClick={() =>
                        onSearch?.({
                            q: keyword,
                            type: SearchType.Posts,
                        })
                    }
                >
                    <SearchIcon width={20} height={20} className="ml-0.5 shrink-0" />
                    <div className="flex min-w-0 flex-col">
                        <div className="text-sm leading-[18px] text-second">
                            <Trans>
                                Search{' '}
                                <Link
                                    className="relative z-1 text-highlight hover:underline"
                                    href={fixSearchUrl(
                                        false,
                                        keyword,
                                        SearchType.Posts,
                                        source,
                                        predictionEventsStatus,
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSearch?.({
                                            q: keyword,
                                            type: SearchType.Posts,
                                        });
                                    }}
                                >
                                    posts
                                </Link>
                                ,{' '}
                                <Link
                                    className="relative z-1 text-highlight hover:underline"
                                    href={fixSearchUrl(
                                        false,
                                        keyword,
                                        SearchType.Profiles,
                                        source,
                                        predictionEventsStatus,
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSearch?.({
                                            q: keyword,
                                            type: SearchType.Profiles,
                                        });
                                    }}
                                >
                                    users
                                </Link>
                                ,{' '}
                                <Link
                                    className="relative z-1 text-highlight hover:underline"
                                    href={fixSearchUrl(
                                        false,
                                        keyword,
                                        SearchType.Prediction,
                                        source,
                                        predictionEventsStatus,
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSearch?.({
                                            q: keyword,
                                            type: SearchType.Prediction,
                                        });
                                    }}
                                >
                                    predictions
                                </Link>{' '}
                                and{' '}
                                <Link
                                    className="relative z-1 text-highlight hover:underline"
                                    href={fixSearchUrl(
                                        false,
                                        keyword,
                                        SearchType.Tokens,
                                        source,
                                        predictionEventsStatus,
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSearch?.({
                                            q: keyword,
                                            type: SearchType.Tokens,
                                        });
                                    }}
                                >
                                    tokens
                                </Link>{' '}
                                by keyword or link
                            </Trans>
                        </div>
                    </div>
                </div>

                {debouncedKeyword && (isSymbol || isValidAddress(debouncedKeyword)) ? (
                    <SuggestTokenList query={debouncedKeyword} onSelect={onSelect} />
                ) : (
                    <SuggestProfileList query={debouncedKeyword} onSelect={onSelect} />
                )}
            </div>
        );
    }

    if (!records.length) return null;
    return (
        <div className={containerClasses}>
            <h2 className="flex p-3 pb-2 text-sm">
                <span className="font-bold text-main">
                    <Trans>Recent</Trans>
                </span>
                <ClickableButton
                    className="ml-auto font-bold text-highlight"
                    onClick={() => {
                        clearAll();
                        onClear?.();
                    }}
                >
                    <Trans>Clear All</Trans>
                </ClickableButton>
            </h2>
            {records.length ? (
                <menu className="my-0">
                    {records.map((record) => (
                        <div className="flex cursor-pointer items-center px-3 hover:bg-bg" key={record}>
                            <Link
                                className="flex min-w-0 flex-1 items-center truncate"
                                href={getSearchUrlForRecord(
                                    record,
                                    autoSearchType || false,
                                    isSearchPage,
                                    searchType,
                                    source,
                                    predictionEventsStatus,
                                )}
                                onClick={() => {
                                    addRecord(record);
                                    onSearch?.({ q: record });
                                }}
                            >
                                <SearchIcon width={18} height={18} className="shrink-0" />
                                <span className="ml-4 grow truncate py-2 text-main">{record}</span>
                            </Link>
                            <ClearButton
                                size={16}
                                className="ml-auto text-second"
                                IconProps={{ className: 'text-inherit' }}
                                tooltip={<Trans>Remove</Trans>}
                                onClick={() => {
                                    removeRecord(record);
                                }}
                            />
                        </div>
                    ))}
                </menu>
            ) : null}
        </div>
    );
}
