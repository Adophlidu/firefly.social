'use client';

import { classNames } from '@dimensiondev/utils';
import { first } from 'lodash-es';
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import FireflyIcon from '@/assets/firefly.svg';
import MagnifierIcon from '@/assets/magnifier.svg';
import MenuIcon from '@/assets/menu.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { HomeTabs } from '@/components/HomeTab/index.js';
import { BackButton } from '@/components/IconButton.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { SearchRecommendation } from '@/components/Search/SearchRecommendation.js';
import { IS_FIREFOX } from '@/constants/browser.js';
import { PageRoute } from '@/constants/enum.js';
import { usePathname, useRouter } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { parseDiscoverPageUrl } from '@/helpers/parseDiscoverPageUrl.js';
import { parseFollowingPageUrl } from '@/helpers/parseFollowingPageUrl.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';
import { useSearchHistoryStateStore } from '@/store/useSearchHistoryStore.js';
import { type SearchState, useSearchStateStore } from '@/store/useSearchStore.js';

interface NavigatorBarForMobileProps {
    /** Fix the left button as back button */
    enableFixedBack?: boolean;
    enableSearch?: boolean;
}

const changeBodyOverflow = (overflow: 'auto' | 'hidden') => {
    if (IS_FIREFOX) document.body.style.overflowY = overflow;
};

export const NavigatorBarForMobile = memo(function NavigatorBarForMobile({
    enableFixedBack = false,
    enableSearch = true,
}: NavigatorBarForMobileProps) {
    const router = useRouter();

    const pathname = usePathname();
    const isSearchPage = isRoutePathname(pathname, PageRoute.Search);
    const isHomePage = !!parseFollowingPageUrl(pathname) || !!parseDiscoverPageUrl(pathname);
    const [searchMode, setSearchMode] = useState(isSearchPage);
    const [showRecommendation, setShowRecommendation] = useState(false);
    const isLogin = useIsLoginFirefly();
    const profiles = useCurrentProfiles();

    const { searchKeyword, updateState } = useSearchStateStore();
    const { updateSidebarOpen } = useNavigatorState();
    const { addRecord } = useSearchHistoryStateStore();

    const inputRef = useRef<HTMLInputElement>(null);
    const [inputText, setInputText] = useState(searchKeyword);
    const [title, setTitle] = useState('');

    const handleInputSubmit = (state: SearchState) => {
        if (state.q) addRecord(state.q);
        updateState(state);
        setShowRecommendation(false);
    };

    useLayoutEffect(() => {
        setInputText(searchKeyword);
    }, [searchKeyword]);

    useEffect(() => {
        const onTouchMove = () => {
            changeBodyOverflow('auto');
        };
        window.addEventListener('touchmove', onTouchMove, { passive: false });

        const onPopState = () => {
            setTimeout(() => {
                const currentTitle = first(document.title.split(' '));
                if (currentTitle) setTitle(currentTitle);
            }, 0);
        };
        window.addEventListener('popstate', onPopState);
        return () => {
            onTouchMove();
            window.removeEventListener('popstate', onPopState);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, []);

    useLayoutEffect(() => {
        const observer = new MutationObserver(() => {
            const title = first(document.title.split(' '));
            if (!title) return;
            setTitle(title);
        });

        observer.observe(document.head, {
            childList: true,
            characterData: true,
            subtree: true,
        });
        return () => {
            observer.disconnect();
        };
    }, [pathname]);

    const closeRecommendation = useCallback(() => setShowRecommendation(false), []);

    return (
        <>
            <header className="flex w-full items-center gap-4 px-4 py-[7px] text-main">
                {searchMode || enableFixedBack || isSearchPage ? (
                    <div className="flex size-[30px] shrink-0 justify-center">
                        <BackButton
                            size={30}
                            onClick={() => {
                                if (isSearchPage || enableFixedBack) router.back();
                                if (!enableSearch) return;
                                setSearchMode(false);
                                setShowRecommendation(false);
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex h-[30px] shrink-0 justify-start">
                        <ClickableButton
                            className="flex items-center justify-center"
                            onClick={() => {
                                updateSidebarOpen(true);
                            }}
                        >
                            {profiles.length ? (
                                profiles.map((x) => (
                                    <div className="relative -mr-2" key={`${x.source}_${x.profileId}`}>
                                        <ProfileAvatar size={30} profile={x} enableSourceIcon={false} />
                                    </div>
                                ))
                            ) : (
                                <MenuIcon />
                            )}
                        </ClickableButton>
                    </div>
                )}
                <h1 className="flex h-10 flex-1 items-center justify-center">
                    {searchMode || isSearchPage ? (
                        <form
                            className="flex flex-1 items-center rounded-md bg-lightBg px-3"
                            onSubmit={(ev) => {
                                ev.preventDefault();
                                handleInputSubmit({ q: inputText });
                            }}
                        >
                            <MagnifierIcon width={18} height={18} />
                            <SearchInput
                                value={inputText}
                                onChange={(ev) => setInputText(ev.currentTarget.value)}
                                onFocus={() => {
                                    setShowRecommendation(true);
                                    changeBodyOverflow('hidden');
                                }}
                                onClick={() => changeBodyOverflow('hidden')}
                                onBlur={() => changeBodyOverflow('auto')}
                                onClear={() => setInputText('')}
                            />
                        </form>
                    ) : (
                        <>
                            {isHomePage && isLogin ? (
                                <HomeTabs onlyFilter buttonClass="!mx-auto" containerClass="justify-center h-[54px]" />
                            ) : profiles.length && title ? (
                                <span className="text-[18px] font-bold leading-6">{title}</span>
                            ) : (
                                <FireflyIcon
                                    className={classNames('relative', {
                                        '-left-2': profiles.length === 3,
                                    })}
                                />
                            )}
                        </>
                    )}
                </h1>
                {enableSearch && !searchMode ? (
                    <div className="flex size-[30px] justify-center">
                        <ClickableButton
                            onClick={() => {
                                inputRef.current?.focus();
                                setSearchMode(true);
                            }}
                        >
                            <MagnifierIcon />
                        </ClickableButton>
                    </div>
                ) : null}
            </header>
            {showRecommendation && !isSearchPage ? (
                <SearchRecommendation
                    fullScreen
                    keyword={searchKeyword}
                    onSearch={closeRecommendation}
                    onSelect={closeRecommendation}
                    onClear={() => inputRef.current?.focus()}
                />
            ) : null}
        </>
    );
});
