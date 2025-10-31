'use client';

import { classNames } from '@dimensiondev/utils';
import { skipToken, useQuery } from '@tanstack/react-query';
import { type HTMLProps, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useOnClickOutside } from 'usehooks-ts';

import SearchIcon from '@/assets/search.svg';
import { BackButton } from '@/components/IconButton.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { SearchRecommendation } from '@/components/Search/SearchRecommendation.js';
import { Section } from '@/components/Semantic/Section.js';
import { PageRoute, SearchType } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isValidAddress, isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { resolveSearchTypeFromQuery } from '@/helpers/resolveSearchTypeFromQuery.js';
import { useComeBack } from '@/hooks/useComeback.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { useSearchHistoryStateStore } from '@/store/useSearchHistoryStore.js';
import { type SearchState, useSearchStateStore } from '@/store/useSearchStore.js';

interface SearchBarProps extends HTMLProps<HTMLDivElement> {
    slot: 'header' | 'secondary';
    autoSearchType?: boolean;
}

function useDetectAddress(address?: string) {
    const isAddress = isValidAddressEthereum(address);

    return useQuery({
        queryKey: ['detect-address', address],
        staleTime: 1000 * 60 * 60,
        enabled: isAddress,
        queryFn: isAddress ? () => FireflyEndpointProvider.detectAddress(address) : skipToken,
        select: (data) => data?.list[0],
    });
}

function SearchBar({ slot, autoSearchType = false, className, ...rest }: SearchBarProps) {
    const [showRecommendation, setShowRecommendation] = useState(false);

    const { searchKeyword, updateState } = useSearchStateStore();
    const { addRecord } = useSearchHistoryStateStore();

    const pathname = usePathname();
    const isSearchPage = isRoutePathname(pathname, PageRoute.Search);
    const isExplorePage = isRoutePathname(pathname, PageRoute.Explore);
    const rootRef = useRef<HTMLDivElement>(null!);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputText, setInputText] = useState(searchKeyword);

    const comeback = useComeBack();

    useOnClickOutside(rootRef, () => {
        setShowRecommendation(false);
    });

    const handleInputSubmit = (state: SearchState) => {
        if (state.q) addRecord(state.q);
        updateState(state);
        setShowRecommendation(false);
    };

    useLayoutEffect(() => {
        setInputText(searchKeyword);
    }, [searchKeyword]);

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
        <div
            className={classNames(
                'hidden items-center pt-2.5 md:flex',
                {
                    sticky: isExplorePage,
                },
                className,
            )}
            {...rest}
            ref={rootRef}
        >
            {isSearchPage && slot === 'header' ? (
                <BackButton className="mr-7 cursor-pointer" onClick={comeback} />
            ) : null}
            <div className="group relative flex grow items-center rounded-xl border border-transparent bg-lightBg px-3 text-main focus-within:border-highlight focus-within:bg-primaryBottom">
                <SearchIcon
                    width={18}
                    height={18}
                    className="shrink-0 text-primaryMain group-focus-within:text-highlight"
                />
                <form
                    className="w-full flex-1"
                    onSubmit={(ev) => {
                        ev.preventDefault();
                        const autoRouting = autoSearchType || isValidAddress(inputText);
                        const searchType = isProfile
                            ? SearchType.Profiles
                            : isTokenAddress
                              ? SearchType.Tokens
                              : autoRouting
                                ? resolveSearchTypeFromQuery(inputText, isTokenAddress)
                                : undefined;

                        handleInputSubmit({
                            q: inputText,
                            type: searchType,
                        });
                    }}
                >
                    <SearchInput
                        className="box-border h-[35px] focus:text-main"
                        value={inputText}
                        onChange={(ev) => setInputText(ev.currentTarget.value)}
                        onFocus={() => setShowRecommendation(true)}
                        onClear={() => setInputText('')}
                    />
                </form>
                {showRecommendation ? (
                    <SearchRecommendation
                        autoSearchType
                        keyword={inputText}
                        onSearch={closeRecommendation}
                        onSelect={closeRecommendation}
                        onClear={() => inputRef.current?.focus()}
                    />
                ) : null}
            </div>
        </div>
    );
}

export function HeaderSearchBar() {
    const pathname = usePathname();
    const isSearchPage = isRoutePathname(pathname, PageRoute.Search);
    const isExplorePage = isRoutePathname(pathname, PageRoute.Explore);
    return isSearchPage || isExplorePage ? <SearchBar slot="header" className="px-4 py-2.5" /> : null;
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
