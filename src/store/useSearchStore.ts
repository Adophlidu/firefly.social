import { safeUnreachable } from '@dimensiondev/utils';
import { useCallback } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { ClubType, SearchType, Source } from '@/constants/enum.js';
import { usePathname, useRouter, useSearchParams } from '@/esm/navigation.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';

interface SearchTypeState {
    source: Source | undefined;
    searchType: SearchType | undefined;
    clubType: ClubType | undefined;
    updateSearchType: (type: SearchType) => void;
    updateSource: (source: Source) => void;
    updateClubType: (clubType: ClubType) => void;
}

const useSearchStateBase = create<SearchTypeState, [['zustand/immer', never]]>(
    immer((set) => ({
        searchType: undefined,
        source: undefined,
        clubType: undefined,
        updateSearchType: (type: SearchType) =>
            set((state) => {
                state.searchType = type;
            }),
        updateSource: (source: Source) =>
            set((state) => {
                state.source = source;
            }),
        updateClubType: (clubType: ClubType) =>
            set((state) => {
                state.clubType = clubType;
            }),
    })),
);

const useStore = createSelectors(useSearchStateBase);

function resolveSourceFromClubType(clubType: ClubType) {
    switch (clubType) {
        case ClubType.BskyFeed:
            return Source.Bsky;
        case ClubType.FarcasterChannel:
            return Source.Farcaster;
        case ClubType.LensGroup:
            return Source.Lens;
        default:
            safeUnreachable(clubType);
            return undefined;
    }
}

function getPathParams(path: string):
    | {
          source?: Source;
          searchType?: SearchType;
          clubType?: ClubType;
      }
    | undefined {
    const pathArray = path.split('/');

    if (isRoutePathname(path, '/search/:type', true)) {
        return {
            source: Source.Farcaster,
            searchType: pathArray[2] as SearchType,
            clubType: undefined,
        };
    }

    if (isRoutePathname(path, '/search/:source/:type', true)) {
        if (pathArray[2] === SearchType.Clubs) {
            return {
                source: resolveSourceFromClubType(pathArray[3] as ClubType),
                searchType: SearchType.Clubs,
                clubType: pathArray[3] as ClubType,
            };
        }
        return {
            source: resolveSourceFromUrl(pathArray[2]),
            searchType: pathArray[3] as SearchType,
            clubType: undefined,
        };
    }

    return;
}

export interface SearchState {
    type?: SearchType;
    q?: string;
    clubType?: ClubType;
}

export function useSearchStateStore() {
    const params = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { source, searchType, clubType, updateSearchType, updateClubType } = useStore();

    const pathParams = getPathParams(pathname);
    const currentSource = pathParams?.source || source || Source.Farcaster;
    const currentType = pathParams?.searchType || searchType || SearchType.Posts;
    const currentClubType = pathParams?.clubType || clubType || ClubType.FarcasterChannel;

    const updateState = useCallback(
        (state: SearchState, replace?: boolean) => {
            const newQuery = state.q || params.get('q');
            const newType = state.type || currentType;
            const newClubType = state.clubType || currentClubType;

            updateSearchType(newType);
            updateClubType(newClubType);

            // search input is empty
            if (!newQuery) return;

            const url = resolveSearchUrl(newQuery, newType, currentSource);
            if (replace) router.replace(url);
            else router.push(url);
        },
        [params, router, currentSource, currentType, currentClubType, updateSearchType, updateClubType],
    );

    return {
        // use ?? means '' is valid value, it was used when clear the search input
        searchKeyword: params.get('q') || '',
        searchType: currentType,
        source: currentSource,
        clubType: currentClubType,
        updateState,
        updateSearchType,
    };
}
