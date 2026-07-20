'use client';

import type { RealtimeChannel, RealtimeClient } from '@supabase/realtime-js';
import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useRef, useState } from 'react';

import { dmKeys } from '@/hooks/useDmSession.js';
import { logger } from '@/libs/Logger.js';
import { createChatRealtimeSession } from '@/providers/orb/chat/api.js';
import { getChatRealtimeClient } from '@/providers/orb/chat/supabase.js';

const REALTIME_REFETCH_DEBOUNCE_MS = 500;
const TOKEN_REFRESH_SKEW_MS = 60_000;
const TOKEN_REFRESH_FALLBACK_MS = 10 * 60_000;

type RealtimeRow = Record<string, unknown>;
interface ChangePayload {
    eventType?: string;
    new?: RealtimeRow;
    old?: RealtimeRow;
}

function getRowString(row: RealtimeRow | undefined, key: string) {
    const value = row?.[key];
    return typeof value === 'string' ? value : undefined;
}

function getPayloadChannelId(payload: ChangePayload) {
    return getRowString(payload.new, 'channel_id') ?? getRowString(payload.old, 'channel_id');
}

function getPayloadRowId(payload: ChangePayload) {
    return getRowString(payload.new, 'id') ?? getRowString(payload.old, 'id');
}

function getPayloadUnreadCount(payload: ChangePayload) {
    const value = payload.new?.unread_count;
    return typeof value === 'number' ? value : undefined;
}

export function shouldRefreshDmCounters(
    channelId: string | undefined,
    activeChannelId: string | undefined,
    isActiveChannelRead = false,
) {
    if (!channelId || !activeChannelId || channelId !== activeChannelId) return true;
    return isActiveChannelRead;
}

export function encodeAddressToByteaHexAscii(address: string) {
    const bytes = new TextEncoder().encode(address.toLowerCase());
    return `\\x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function getRealtimeTokenRefreshDelay(token: string, now = Date.now()) {
    try {
        const { exp } = jwtDecode<{ exp?: number }>(token);
        if (!exp) return TOKEN_REFRESH_FALLBACK_MS;
        return Math.max(60_000, exp * 1_000 - now - TOKEN_REFRESH_SKEW_MS);
    } catch {
        return TOKEN_REFRESH_FALLBACK_MS;
    }
}

export function shouldRefreshRealtimeToken(token: string | undefined, now = Date.now()) {
    if (!token) return true;

    try {
        const { exp } = jwtDecode<{ exp?: number }>(token);
        return !exp || exp * 1_000 - now <= TOKEN_REFRESH_SKEW_MS;
    } catch {
        return true;
    }
}

export function useDmRealtime(account: string | undefined, activeChannelId: string | undefined) {
    const queryClient = useQueryClient();
    const activeChannelIdRef = useRef(activeChannelId);
    const counterSuppressionGenerationRef = useRef(0);
    const [isActiveChannelCounterRefreshSuppressed, setIsActiveChannelCounterRefreshSuppressed] = useState(false);

    useEffect(() => {
        activeChannelIdRef.current = activeChannelId;
        counterSuppressionGenerationRef.current += 1;
        setIsActiveChannelCounterRefreshSuppressed(false);
    }, [activeChannelId]);

    useEffect(() => {
        if (!account) return;

        const realtimeAccount = account;
        let isDisposed = false;
        let realtimeClient: RealtimeClient | undefined;
        let channels: RealtimeChannel[] = [];
        let flushTimer: ReturnType<typeof setTimeout> | undefined;
        let tokenRefreshTimer: ReturnType<typeof setTimeout> | undefined;
        let tokenRefreshPromise: Promise<RealtimeClient | undefined> | undefined;
        let realtimeToken: string | undefined;
        let hasCaughtUp = false;
        const pendingChannelIds = new Set<string>();
        let shouldRefreshChannels = false;
        let shouldRefreshCounters = false;
        let counterSuppressionReleaseGeneration: number | undefined;

        const flush = () => {
            flushTimer = undefined;
            if (isDisposed) return;

            const refreshes: Array<Promise<unknown>> = [];
            if (shouldRefreshChannels) {
                shouldRefreshChannels = false;
                refreshes.push(queryClient.invalidateQueries({ queryKey: dmKeys.channelsRoot(realtimeAccount) }));
            }
            if (shouldRefreshCounters) {
                shouldRefreshCounters = false;
                refreshes.push(queryClient.invalidateQueries({ queryKey: dmKeys.counters(realtimeAccount) }));
            }

            for (const channelId of pendingChannelIds) {
                void queryClient.invalidateQueries({ queryKey: dmKeys.lastMessage(realtimeAccount, channelId) });
                void queryClient.invalidateQueries({ queryKey: dmKeys.messages(realtimeAccount, channelId) });
            }

            pendingChannelIds.clear();

            const releaseGeneration = counterSuppressionReleaseGeneration;
            counterSuppressionReleaseGeneration = undefined;
            if (releaseGeneration !== undefined) {
                void Promise.all(refreshes).then(() => {
                    if (isDisposed || counterSuppressionGenerationRef.current !== releaseGeneration) return;
                    setIsActiveChannelCounterRefreshSuppressed(false);
                });
            }
        };

        const scheduleRefresh = (channelId?: string, refreshCounters = true) => {
            shouldRefreshChannels = true;
            shouldRefreshCounters ||= refreshCounters;
            if (channelId) pendingChannelIds.add(channelId);
            if (!flushTimer) flushTimer = setTimeout(flush, REALTIME_REFETCH_DEBOUNCE_MS);
        };

        const suppressActiveChannelCounterRefresh = () => {
            counterSuppressionGenerationRef.current += 1;
            setIsActiveChannelCounterRefreshSuppressed(true);
        };
        const handleMessage = (payload: ChangePayload) => {
            const channelId = getPayloadChannelId(payload);
            const refreshCounters = shouldRefreshDmCounters(channelId, activeChannelIdRef.current);
            if (!refreshCounters) suppressActiveChannelCounterRefresh();
            scheduleRefresh(channelId, refreshCounters);
        };
        const handleChannelChange = (payload: ChangePayload) => {
            const channelId = getPayloadChannelId(payload) ?? getPayloadRowId(payload);
            const refreshCounters = shouldRefreshDmCounters(channelId, activeChannelIdRef.current);
            if (!refreshCounters) suppressActiveChannelCounterRefresh();
            scheduleRefresh(channelId, refreshCounters);
        };
        const handleMembershipChange = (payload: ChangePayload) => {
            const channelId = getPayloadChannelId(payload) ?? getPayloadRowId(payload);
            const isActiveChannelRead = getPayloadUnreadCount(payload) === 0;
            const refreshCounters = shouldRefreshDmCounters(channelId, activeChannelIdRef.current, isActiveChannelRead);
            if (!refreshCounters) {
                suppressActiveChannelCounterRefresh();
            } else if (channelId === activeChannelIdRef.current && isActiveChannelRead) {
                counterSuppressionReleaseGeneration = counterSuppressionGenerationRef.current;
            }
            scheduleRefresh(channelId, refreshCounters);
        };
        const handleStatus = (status: string) => {
            if (status === 'SUBSCRIBED' && !hasCaughtUp) {
                hasCaughtUp = true;
                scheduleRefresh(activeChannelIdRef.current);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                hasCaughtUp = false;
            }
        };

        const handleTokenRefreshError = (error: unknown) => {
            logger.warn('[useDmRealtime] Failed to refresh realtime authentication', error);
            if (!isDisposed) {
                if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
                tokenRefreshTimer = setTimeout(() => void refreshToken().catch(handleTokenRefreshError), 60_000);
            }
        };

        async function updateToken() {
            const session = await createChatRealtimeSession(realtimeAccount);
            if (isDisposed) return;
            realtimeClient = getChatRealtimeClient(session);
            await realtimeClient.setAuth(session.token);
            realtimeToken = session.token;
            tokenRefreshTimer = setTimeout(
                () => void refreshToken().catch(handleTokenRefreshError),
                getRealtimeTokenRefreshDelay(session.token),
            );
            return realtimeClient;
        }

        function refreshToken() {
            if (tokenRefreshPromise) return tokenRefreshPromise;
            if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
            tokenRefreshPromise = updateToken().finally(() => {
                tokenRefreshPromise = undefined;
            });
            return tokenRefreshPromise;
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible' || isDisposed) return;
            scheduleRefresh(activeChannelIdRef.current);
            const clientPromise = shouldRefreshRealtimeToken(realtimeToken)
                ? refreshToken()
                : Promise.resolve(realtimeClient);
            void clientPromise
                .then((client) => {
                    if (!client || isDisposed) return;
                    client.connect();
                })
                .catch(handleTokenRefreshError);
        };

        const start = async () => {
            try {
                const realtimeClient = await refreshToken();
                if (!realtimeClient || isDisposed) return;

                const channelName = (name: string) => `firefly-web-dm:${realtimeAccount.toLowerCase()}:${name}`;
                channels = [
                    realtimeClient
                        .channel(channelName('messages'))
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) =>
                            handleMessage(payload as ChangePayload),
                        )
                        .subscribe(handleStatus),
                    realtimeClient
                        .channel(channelName('channels'))
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_channels' }, (payload) =>
                            handleChannelChange(payload as ChangePayload),
                        )
                        .subscribe(handleStatus),
                    realtimeClient
                        .channel(channelName('memberships'))
                        .on(
                            'postgres_changes',
                            {
                                event: '*',
                                schema: 'public',
                                table: 'chat_channel_memberships',
                                filter: `user_id=eq.${encodeAddressToByteaHexAscii(realtimeAccount)}`,
                            },
                            (payload) => handleMembershipChange(payload as ChangePayload),
                        )
                        .subscribe(handleStatus),
                ];
            } catch (error) {
                handleTokenRefreshError(error);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        void start();

        return () => {
            isDisposed = true;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (flushTimer) clearTimeout(flushTimer);
            if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
            if (realtimeClient) {
                for (const channel of channels) void realtimeClient.removeChannel(channel);
            }
            channels = [];
        };
    }, [account, queryClient]);

    return isActiveChannelCounterRefreshSuppressed;
}
