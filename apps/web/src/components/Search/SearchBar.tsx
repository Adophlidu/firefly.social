'use client';

import SearchIcon from '@dimensiondev/assets/search.svg';
import { classNames } from '@dimensiondev/utils';
import { isValidAddress, isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { skipToken, useQuery } from '@tanstack/react-query';
import { type HTMLProps, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useOnClickOutside } from 'usehooks-ts';

import { BackButton } from '@/components/IconButton.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { SearchRecommendation } from '@/components/Search/SearchRecommendation.js';
import { Section } from '@/components/Semantic/Section.js';
import { ExploreType, PageRoute, SearchType } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { usePathname, useRouter } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveSearchTypeFromQuery } from '@/helpers/resolveSearchTypeFromQuery.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { resolveSearchUrlType, SearchUrlKind } from '@/helpers/resolveSearchUrlType.js';
import { useComeBack } from '@/hooks/useComeback.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { useSearchHistoryStateStore } from '@/store/useSearchHistoryStore.js';
import { type SearchState, useSearchStateStore } from '@/store/useSearchStore.js';

interface SearchBarProps extends HTMLProps<HTMLDivElement> {
    slot: 'header' | 'secondary';
    autoSearchType?: boolean;
}

const SEARCH_TYPE_TO_EXPLORE: Partial<Record<SearchType, ExploreType>> = {
    [SearchType.Profiles]: ExploreType.TopProfiles,
    [SearchType.Tokens]: ExploreType.CryptoTrends,
    [SearchType.NFTs]: ExploreType.NFTs,
    [SearchType.Clubs]: ExploreType.TopChannels,
    [SearchType.Prediction]: ExploreType.Prediction,
};

function resolveExploreUrlFromSearchType(searchType: SearchType): string {
    const exploreType = SEARCH_TYPE_TO_EXPLORE[searchType];
    if (!exploreType) return resolveExploreUrl(ExploreType.Prediction);
    return resolveExploreUrl(exploreType);
}

function useDetectAddress(address?: string) {
    const isAddress = isValidAddressEthereum(address);

    return useQuery({
        queryKey: ['detect-address', address?.toLowerCase()],
        staleTime: STALE_TIMES.HOUR_1,
        enabled: isAddress,
        queryFn: isAddress ? () => fireflyWalletProvider.detectAddress(address) : skipToken,
        select: (data) => data?.list[0],
    });
}

export function SearchBar({ slot, autoSearchType = false, className, ...rest }: SearchBarProps) {
    const [showRecommendation, setShowRecommendation] = useState(false);
    const keepOriginalInputRef = useRef(false);

    const { searchKeyword, searchType, updateState } = useSearchStateStore();
    const { addRecord } = useSearchHistoryStateStore();

    const pathname = usePathname();
    const isSearchPage = isRoutePathname(pathname, PageRoute.Search);
    const isExplorePage = isRoutePathname(pathname, PageRoute.Explore);
    const rootRef = useRef<HTMLDivElement>(null!);
    const inputRef = useRef<HTMLInputElement>(null);

    const [inputText, setInputText] = useState(searchKeyword);

    const comeback = useComeBack();
    const router = useRouter();

    useOnClickOutside(rootRef, () => {
        setShowRecommendation(false);
    });

    const handleInputSubmit = (state: SearchState) => {
        if (state.q) {
            addRecord(state.q);
            setInputText(state.q);
        }

        // Check if the query is a URL and route accordingly
        const urlResult = resolveSearchUrlType(state.q || '');
        if (urlResult) {
            if (urlResult.kind === SearchUrlKind.FireflyInternal && urlResult.internalPath) {
                router.push(urlResult.internalPath);
                setShowRecommendation(false);
                return;
            }

            // Keep the original URL in the input box for display
            keepOriginalInputRef.current = true;
            if (state.q) setInputText(state.q);

            // Always use the full URL in the search query parameter
            // The search components will detect and extract identifier if needed
            updateState({
                q: state.q,
                type: urlResult.searchType,
                source: urlResult.source,
            });

            setShowRecommendation(false);
            return;
        }

        updateState(state);
        setShowRecommendation(false);
    };

    useLayoutEffect(() => {
        if (!keepOriginalInputRef.current) {
            const currentUrlResult = resolveSearchUrlType(inputText);
            const shouldKeepCurrentInput =
                currentUrlResult?.identifier === searchKeyword && currentUrlResult?.searchType === searchType;

            if (!shouldKeepCurrentInput) {
                setInputText(searchKeyword);
            }
        } else {
            keepOriginalInputRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchKeyword, searchType]);

    const closeRecommendation = useCallback(() => setShowRecommendation(false), []);
    const { data } = useDetectAddress(inputText);
    const isProfile = data?.address_type === 'eoa' || data?.address_type === 'soa';
    const isTokenAddress =
        data?.address_type === 'contract' &&
        !!data.contract_info &&
        (data.contract_type === 'ERC20' || data.contract_type === 'token');

    if (slot === 'header' && !isSearchPage && !isExplorePage) return null;
    if (slot === 'secondary' && (isSearchPage || isExplorePage)) return null;

    return (
        <div className={classNames('hidden items-center pt-2.5 md:flex', className)} {...rest} ref={rootRef}>
            {isSearchPage && slot === 'header' ? (
                <BackButton className="mr-7 cursor-pointer" onClick={comeback} />
            ) : null}
            <div className="bg-lightBg text-main focus-within:border-highlight focus-within:bg-primaryBottom group relative flex grow items-center rounded-xl border border-transparent px-3">
                <SearchIcon
                    width={18}
                    height={18}
                    className="text-primaryMain group-focus-within:text-highlight shrink-0"
                />
                <form
                    className="w-full flex-1"
                    onSubmit={(ev) => {
                        ev.preventDefault();

                        const urlResult = resolveSearchUrlType(inputText);
                        const autoRouting = autoSearchType || isValidAddress(inputText);
                        const resolvedSearchType =
                            urlResult?.searchType ??
                            (isProfile
                                ? SearchType.Profiles
                                : isTokenAddress
                                  ? SearchType.Tokens
                                  : autoRouting
                                    ? resolveSearchTypeFromQuery(inputText, isTokenAddress)
                                    : undefined);

                        handleInputSubmit({
                            q: inputText,
                            type: resolvedSearchType,
                        });

                        // handleInputSubmit already handles URL navigation via updateState
                        // Only push for non-URL searches on non-search pages
                        if (!isSearchPage && !urlResult) {
                            const searchUrl = resolveSearchUrl(inputText, resolvedSearchType);
                            router.push(searchUrl);
                        }
                    }}
                >
                    <SearchInput
                        className="focus:text-main box-border h-[35px]"
                        value={inputText}
                        onChange={(ev) => {
                            const newValue = ev.currentTarget.value;
                            setInputText(newValue);

                            if (!newValue && inputText && isSearchPage) {
                                const exploreUrl = resolveExploreUrlFromSearchType(searchType);
                                router.push(exploreUrl);
                            }
                        }}
                        onFocus={() => setShowRecommendation(true)}
                        onClear={() => {
                            setInputText('');
                            if (isSearchPage) {
                                const exploreUrl = resolveExploreUrlFromSearchType(searchType);
                                router.push(exploreUrl);
                            }
                        }}
                    />
                </form>
                {showRecommendation ? (
                    <SearchRecommendation
                        autoSearchType
                        keyword={inputText}
                        onSearch={handleInputSubmit}
                        onSelect={closeRecommendation}
                        onClear={() => inputRef.current?.focus()}
                    />
                ) : null}
            </div>
        </div>
    );
}

export function HeaderSearchBar() {
    return <SearchBar slot="header" className="px-4 py-2.5" />;
}

export function AsideSearchBar() {
    const pathname = usePathname();
    const isSearchPage = !isRoutePathname(pathname, PageRoute.Search);
    return isSearchPage ? (
        <Section title="Search Bar">
            <SearchBar slot="secondary" autoSearchType />
        </Section>
    ) : null;
}
