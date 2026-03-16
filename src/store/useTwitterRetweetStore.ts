import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createPersistStorage } from '@/helpers/createPersistStorage.js';

type TwitterProfileId = string;
type TweetId = string;
type TwitterRetweetKey = `${TwitterProfileId}:${TweetId}`;

interface TwitterRetweetStore {
    undoReposts: Record<TwitterRetweetKey, boolean>;
    undoRepost: (profileId: TwitterProfileId, tweetId: TweetId) => void;
    isUndoRepost: (profileId: TwitterProfileId, tweetId: TweetId) => boolean;
    size: () => number;
}

function generateTwitterRetweetKey(profileId: TwitterProfileId, tweetId: TweetId) {
    return `${profileId}:${tweetId}` as TwitterRetweetKey;
}

export const useTwitterRetweetStore = create<
    TwitterRetweetStore,
    [['zustand/persist', unknown], ['zustand/immer', never]]
>(
    persist(
        immer((set, get) => ({
            undoReposts: {},
            undoRepost: (profileId, tweetId) => {
                return set((state) => {
                    const key = generateTwitterRetweetKey(profileId, tweetId);
                    if (!state.undoReposts[key]) {
                        state.undoReposts[key] = true;
                    }
                });
            },
            isUndoRepost: (profileId, tweetId) => {
                const state = get();
                return !!state.undoReposts[generateTwitterRetweetKey(profileId, tweetId)];
            },
            size: () => {
                const state = get();
                return Object.keys(state.undoReposts).length;
            },
        })),
        {
            storage: createPersistStorage<{ undoReposts: Record<TwitterRetweetKey, boolean> }>('twitter-retweet-store'),
            partialize: (state) => ({ undoReposts: state.undoReposts }),
            name: 'twitter-retweet',
        },
    ),
);
