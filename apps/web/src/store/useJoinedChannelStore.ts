import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createPersistStorage } from '@/helpers/createPersistStorage.js';

type JoinedChannelKey = `${string}:${string}`;

interface JoinedChannelStore {
    /** Channels the current user just joined/left, keyed by `${profileId}:${channelId}`. */
    joined: Record<JoinedChannelKey, boolean>;
    markJoined: (profileId: string, channelId: string) => void;
    markLeft: (profileId: string, channelId: string) => void;
    hasJoined: (profileId: string | null | undefined, channelId: string | null | undefined) => boolean;
}

function generateKey(profileId: string, channelId: string) {
    return `${profileId}:${channelId.toLowerCase()}` as JoinedChannelKey;
}

/**
 * Optimistic record of channel (Lens club) membership. The Lens indexer lags
 * behind an on-chain join, so a freshly-joined post keeps reporting its reply
 * gate. We remember the join here so reply/repost gates unblock immediately and
 * stay unblocked across refetches and navigation (FW-7831).
 */
export const useJoinedChannelStore = create<
    JoinedChannelStore,
    [['zustand/persist', unknown], ['zustand/immer', never]]
>(
    persist(
        immer((set, get) => ({
            joined: {},
            markJoined: (profileId, channelId) => {
                set((state) => {
                    state.joined[generateKey(profileId, channelId)] = true;
                });
            },
            markLeft: (profileId, channelId) => {
                set((state) => {
                    delete state.joined[generateKey(profileId, channelId)];
                });
            },
            hasJoined: (profileId, channelId) => {
                if (!profileId || !channelId) return false;
                return !!get().joined[generateKey(profileId, channelId)];
            },
        })),
        {
            storage: createPersistStorage<{ joined: Record<JoinedChannelKey, boolean> }>('joined-channel-store'),
            partialize: (state) => ({ joined: state.joined }),
            name: 'joined-channels',
        },
    ),
);

/** Reactively track whether the given profile just joined the given channel. */
export function useHasJoinedChannel(profileId: string | null | undefined, channelId: string | null | undefined) {
    return useJoinedChannelStore((state) =>
        profileId && channelId ? !!state.joined[generateKey(profileId, channelId)] : false,
    );
}
