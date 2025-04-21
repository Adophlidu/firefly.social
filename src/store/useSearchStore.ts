import { useCallback } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { CommunityType, SearchType, Source } from '@/constants/enum.js';
import { usePathname, useRouter, useSearchParams } from '@/esm/navigation.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';

interface SearchTypeState {
    source: Source | undefined;
    searchType: SearchType | undefined;
    communityType: CommunityType | undefined;
    updateSearchType: (type: SearchType) => void;
    updateSource: (source: Source) => void;
    updateCommunityType: (communityType: CommunityType) => void;
}

const useSearchStateBase = create<SearchTypeState, [['zustand/immer', never]]>(
    immer((set) => ({
        searchType: undefined,
        source: undefined,
        communityType: undefined,
        updateSearchType: (type: SearchType) =>
            set((state) => {
                state.searchType = type;
            }),
        updateSource: (source: Source) =>
            set((state) => {
                state.source = source;
            }),
        updateCommunityType: (communityType: CommunityType) =>
            set((state) => {
                state.communityType = communityType;
            }),
    })),
);

const useStore = createSelectors(useSearchStateBase);

function resolveSourceFromCommunityType(communityType: CommunityType) {
    switch (communityType) {
        case CommunityType.BskyFeed:
            return Source.Bsky;
        case CommunityType.FarcasterChannel:
            return Source.Farcaster;
        case CommunityType.LensGroup:
            return Source.Lens;
        default:
            return undefined;
    }
}

function getPathParams(path: string):
    | {
          source?: Source;
          searchType?: SearchType;
          communityType?: CommunityType;
      }
    | undefined {
    const pathArray = path.split('/');

    if (isRoutePathname(path, '/search/:type', true)) {
        return {
            source: Source.Farcaster,
            searchType: pathArray[2] as SearchType,
            communityType: undefined,
        };
    }

    if (isRoutePathname(path, '/search/:source/:type', true)) {
        if (pathArray[2] === SearchType.Communities) {
            return {
                source: resolveSourceFromCommunityType(pathArray[3] as CommunityType),
                searchType: SearchType.Communities,
                communityType: pathArray[3] as CommunityType,
            };
        }
        return {
            source: resolveSourceFromUrl(pathArray[2]),
            searchType: pathArray[3] as SearchType,
            communityType: undefined,
        };
    }

    return;
}

export interface SearchState {
    type?: SearchType;
    q?: string;
    communityType?: CommunityType;
}

export function useSearchStateStore() {
    const params = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { source, searchType, communityType, updateSearchType, updateCommunityType } = useStore();

    const pathParams = getPathParams(pathname);
    const currentSource = pathParams?.source || source || Source.Farcaster;
    const currentType = pathParams?.searchType || searchType || SearchType.Posts;
    const currentCommunityType = pathParams?.communityType || communityType || CommunityType.FarcasterChannel;

    const updateState = useCallback(
        (state: SearchState, replace?: boolean) => {
            const newQuery = state.q || params.get('q');
            const newType = state.type || currentType;
            const newCommunityType = state.communityType || currentCommunityType;

            updateSearchType(newType);
            updateCommunityType(newCommunityType);

            // search input is empty
            if (!newQuery) return;

            const url = resolveSearchUrl(newQuery, newType, currentSource);
            if (replace) router.replace(url);
            else router.push(url);
        },
        [params, router, currentSource, currentType, currentCommunityType, updateSearchType, updateCommunityType],
    );

    return {
        // use ?? means '' is valid value, it was used when clear the search input
        searchKeyword: params.get('q') || '',
        searchType: currentType,
        source: currentSource,
        communityType: currentCommunityType,
        updateState,
        updateSearchType,
    };
}
