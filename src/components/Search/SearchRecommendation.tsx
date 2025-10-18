'use client';

import { Trans } from '@lingui/react/macro';
import { useDebounce } from 'usehooks-ts';

import SearchIcon from '@/assets/search.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ClearButton } from '@/components/IconButton.js';
import { Link } from '@/components/Link.js';
import { SuggestCollectionList } from '@/components/Search/SuggestCollectionList.js';
import { SuggestProfileList } from '@/components/Search/SuggestProfileList.js';
import { SuggestTokenList } from '@/components/Search/SuggestTokenList.js';
import { PageRoute, SearchType, Source } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { resolveSearchTypeFromQuery } from '@/helpers/resolveSearchTypeFromQuery.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { useSearchHistoryStateStore } from '@/store/useSearchHistoryStore.js';
import { type SearchState, useSearchStateStore } from '@/store/useSearchStore.js';

interface SearchRecommendationProps {
    keyword: string;
    fullScreen?: boolean;
    autoSearchType?: boolean;
    onSearch?: (state: SearchState) => void;
    onSelect?: () => void;
    onClear?: () => void;
}

function fixSearchUrl(isSearchPage: boolean, query: string, searchType: SearchType, source: Source) {
    if (!isSearchPage) return resolveSearchUrl(query);

    return resolveSearchUrl(query, searchType, source);
}

export function SearchRecommendation(props: SearchRecommendationProps) {
    const pathname = usePathname();
    const isSearchPage = isRoutePathname(pathname, PageRoute.Search);
    const { searchType, source } = useSearchStateStore();

    const { keyword, fullScreen = false, autoSearchType, onSearch, onSelect, onClear } = props;
    const { records, addRecord, removeRecord, clearAll } = useSearchHistoryStateStore();

    const debouncedKeyword = useDebounce(keyword, 300);

    if (!records.length && !keyword) return null;

    const containerClasses = classNames(
        'max:max-h-[calc(100vh-59px)] absolute -inset-x-[1px] top-10 z-[1000] flex w-full flex-col overflow-auto overflow-hidden bg-white shadow-[0_4px_30px_0_rgba(0,0,0,0.10)] dark:border dark:border-line dark:bg-primaryBottom',
        {
            'mt-2 rounded-2xl': !fullScreen,
            'bottom-0 mt-3 h-[calc(100vh-40px)] border-none': fullScreen,
        },
    );

    const isSymbol = debouncedKeyword?.startsWith('$');
    if (keyword) {
        return (
            <div className={containerClasses}>
                <h2 className="p-3 pb-0 text-sm font-bold leading-[18px]">
                    <Trans>Posts</Trans>
                </h2>
                <Link
                    className="my-2 flex cursor-pointer items-center px-3 py-2 text-left hover:bg-bg"
                    href={fixSearchUrl(isSearchPage, keyword, searchType, source)}
                    onClick={() =>
                        onSearch?.({
                            q: keyword,
                            type: SearchType.Posts,
                        })
                    }
                >
                    <SearchIcon width={18} height={18} className="shrink-0" />
                    <span className="ml-4 min-w-0 truncate">{keyword}</span>
                </Link>

                {debouncedKeyword && (isSymbol || isValidAddressEthereum(debouncedKeyword)) ? (
                    <>
                        <SuggestTokenList query={debouncedKeyword} onSelect={onSelect} />
                        {!isSymbol ? <SuggestCollectionList query={debouncedKeyword} onSelect={onSelect} /> : null}
                    </>
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
                                href={
                                    autoSearchType && !isSearchPage
                                        ? resolveSearchUrl(record, resolveSearchTypeFromQuery(record))
                                        : fixSearchUrl(isSearchPage, record, searchType, source)
                                }
                                onClick={() => {
                                    addRecord(record);
                                    onSearch?.({ q: record });
                                }}
                            >
                                <SearchIcon width={18} height={18} className="shrink-0" />
                                <span className="color-main ml-4 grow truncate py-2">{record}</span>
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
