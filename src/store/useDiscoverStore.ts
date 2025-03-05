import { uniq } from 'lodash-es';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { type FollowingSource, HomeTab, type SocialSource, Source } from '@/constants/enum.js';
import { FollowingTimelinePlatform } from '@/providers/types/Firefly.js';

type FollowingTimelineSource = Exclude<FollowingSource, Source.Posts>;

interface DiscoverState {
    postTimelinePlatforms: Record<HomeTab, SocialSource[]>;
    followingTimelinePlatforms: Record<FollowingTimelineSource, FollowingTimelinePlatform[]>;
    setFollowingTimelinePlatforms: (
        source: FollowingTimelineSource,
        platform: FollowingTimelinePlatform,
        filtered: boolean,
    ) => void;
    setFilteredPlatform: (tab: HomeTab, source: SocialSource, filter: boolean) => void;
}

export const useDiscoverStore = create<DiscoverState, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer((set, get) => ({
            postTimelinePlatforms: {
                [HomeTab.Discover]: [],
                [HomeTab.Following]: [],
            },
            followingTimelinePlatforms: {
                [Source.Wallet]: [],
                [Source.Polymarket]: [],
                [Source.NFTs]: [],
                [Source.Article]: [],
                [Source.DAOs]: [],
            },
            setFollowingTimelinePlatforms(source, platform, filtered) {
                set((state) => {
                    if (!state.followingTimelinePlatforms[source]) state.followingTimelinePlatforms[source] = [];
                    if (filtered) {
                        state.followingTimelinePlatforms[source] = state.followingTimelinePlatforms[source].filter(
                            (x) => x !== platform,
                        );
                    } else {
                        state.followingTimelinePlatforms[source] = uniq([
                            ...state.followingTimelinePlatforms[source],
                            platform,
                        ]);
                    }
                });
            },
            setFilteredPlatform(tab, source, filtered: boolean) {
                set((state) => {
                    if (!state.postTimelinePlatforms[tab]) state.postTimelinePlatforms[tab] = [];
                    if (filtered) {
                        state.postTimelinePlatforms[tab] = state.postTimelinePlatforms[tab].filter((x) => x !== source);
                    } else {
                        state.postTimelinePlatforms[tab] = uniq([...state.postTimelinePlatforms[tab], source]);
                    }
                });
            },
        })),
        {
            name: 'discover-state',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
