'use client';

import { SessionType } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { LensSession } from '@/providers/lens/Session.js';
import { getChannelCounters } from '@/providers/orb/chat/api.js';
import type { GetChannelsParams } from '@/providers/orb/chat/types.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

// The sidebar unread badge renders on every page, so these lightweight identity/counter hooks live
// here — away from the conversation, media, and upload code in useDirectMessages.ts — to keep that
// heavy graph out of the shared bundle. useDirectMessages.ts re-exports them for back-compat.

export const dmKeys = {
    root: (account: string) => ['dm', account.toLowerCase()] as const,
    channels: (account: string, filter: GetChannelsParams, view: 'inbox' | 'requests' = 'inbox') =>
        [...dmKeys.root(account), 'channels', view, filter] as const,
    messages: (account: string, channelId: string) => [...dmKeys.root(account), 'messages', channelId] as const,
    lastMessage: (account: string, channelId: string) => [...dmKeys.root(account), 'last-message', channelId] as const,
    lastMessageVersion: (account: string, channelId: string, lastMessageAt: string | null) =>
        [...dmKeys.lastMessage(account, channelId), lastMessageAt] as const,
    targetChannel: (account: string, targetAccount: string) =>
        [...dmKeys.root(account), 'target-channel', targetAccount.trim().toLowerCase()] as const,
    counters: (account: string) => [...dmKeys.root(account), 'counters'] as const,
    interactiveAction: (account: string, id: string) => [...dmKeys.root(account), 'interactive-action', id] as const,
    search: (account: string, query: string) => [...dmKeys.root(account), 'search', query] as const,
};

export function useActiveDmIdentity() {
    const profile = useLensProfileStore.use.currentProfile();
    const session = useLensProfileStore.use.currentProfileSession();

    return useMemo(() => {
        if (session?.type !== SessionType.Lens) return null;
        const lensSession = session as LensSession;
        if (!lensSession.address || !lensSession.token) return null;

        return {
            account: lensSession.address,
            profileId: lensSession.profileId,
            profile,
        };
    }, [profile, session]);
}

// DM authenticates with the global Lens session token, so a logged-in Lens account is already
// authenticated — there is no separate Orb sign-in step. Consumers that gate on authentication
// (sidebar badge, messages page) derive from the active Lens identity in one place.
export function useAuthenticatedDmAccount() {
    const identity = useActiveDmIdentity();
    const account = identity?.account;
    return { identity, account, authenticatedAccount: account };
}

export function useDmCounters(account: string | undefined) {
    return useQuery({
        queryKey: dmKeys.counters(account ?? '__signed-out__'),
        queryFn: () => getChannelCounters(account as string),
        enabled: Boolean(account),
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
        staleTime: 15_000,
    });
}
