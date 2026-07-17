'use client';

import { t } from '@lingui/core/macro';
import {
    type InfiniteData,
    useInfiniteQuery,
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { generateVideoCover } from '@/helpers/generateVideoCover.js';
import { dmKeys } from '@/hooks/useDmSession.js';
import {
    ChatApiError,
    createChat,
    getChatChannel,
    getChatChannels,
    getChatMessages,
    getInteractiveAction,
    markMessageAsRead,
    searchProfiles,
    sendMessage,
} from '@/providers/orb/chat/api.js';
import { CHAT_CHANNEL_PAGE_LIMIT, CHAT_MESSAGE_PAGE_LIMIT } from '@/providers/orb/chat/constants.js';
import { createDmAttachment, toDmVideoCompatibilityAttachment } from '@/providers/orb/chat/media.js';
import { resolveDmChannel } from '@/providers/orb/chat/resolveDmChannel.js';
import type {
    ChannelCounters,
    ChatChannel,
    ChatMessage,
    ChatRequestType,
    DmAttachmentDraft,
    GetChannelsParams,
    MentionResult,
    UserMetadata,
} from '@/providers/orb/chat/types.js';
import { uploadToS3 } from '@/services/uploadToS3.js';

// The identity/auth/counter hooks and dmKeys moved to useDmSession.ts so the sidebar unread badge
// (rendered on every page) can import them without dragging this heavy conversation/media/upload
// module into the shared bundle. Re-exported here so existing consumers keep their import paths.
export { dmKeys, useActiveDmIdentity, useAuthenticatedDmAccount, useDmCounters } from '@/hooks/useDmSession.js';

const REQUEST_TYPES: Array<Exclude<ChatRequestType, null>> = ['friends', 'personIFollow', 'followers', 'other'];
const VIDEO_COVER_TIMEOUT_MS = 5_000;
const DM_CHANNELS_REFETCH_INTERVAL_MS = 30_000;
const DM_MESSAGES_REFETCH_INTERVAL_MS = 10_000;

export function useDmChannels(account: string | undefined, params: GetChannelsParams, isRequests: boolean) {
    return useInfiniteQuery({
        queryKey: dmKeys.channels(account ?? '__signed-out__', params, isRequests ? 'requests' : 'inbox'),
        enabled: Boolean(account),
        queryFn: async ({ pageParam }) => {
            if (isRequests) {
                const channelLists = await Promise.all(
                    REQUEST_TYPES.map((requestType) =>
                        getChatChannels(account as string, { ...params, cursor: pageParam, requestType }),
                    ),
                );
                return channelLists.flat();
            }

            return getChatChannels(account as string, { ...params, cursor: pageParam });
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, _pages, lastPageParam) =>
            !isRequests && lastPage.length === CHAT_CHANNEL_PAGE_LIMIT
                ? lastPageParam + CHAT_CHANNEL_PAGE_LIMIT
                : undefined,
        refetchInterval: DM_CHANNELS_REFETCH_INTERVAL_MS,
        refetchIntervalInBackground: false,
    });
}

export function useDmTargetChannel(account: string | undefined, targetAccount: string) {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: dmKeys.targetChannel(account ?? '__signed-out__', targetAccount),
        queryFn: async () => {
            const channel = await resolveDmChannel(account as string, targetAccount);
            await queryClient.invalidateQueries({
                queryKey: [...dmKeys.root(account as string), 'channels'],
                refetchType: 'none',
            });
            return channel;
        },
        enabled: Boolean(account && targetAccount),
        retry: false,
        staleTime: 30_000,
    });
}

function dedupeByIdAndSort<T extends { id: string }>(items: T[], compare: (a: T, b: T) => number): T[] {
    const byId = new Map<string, T>();
    for (const item of items) byId.set(item.id, item);

    return [...byId.values()].sort(compare);
}

export function flattenChannels(pages: ChatChannel[][] | undefined): ChatChannel[] {
    return dedupeByIdAndSort((pages ?? []).flat(), (a, b) =>
        (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''),
    );
}

export function mergeDmChannels(pages: ChatChannel[][] | undefined, startedChannels: ChatChannel[]) {
    const fetchedChannels = flattenChannels(pages);
    const fetchedChannelIds = new Set(fetchedChannels.map((channel) => channel.id));
    return [...startedChannels.filter((channel) => !fetchedChannelIds.has(channel.id)), ...fetchedChannels];
}

export function useDmLastMessages(
    account: string | undefined,
    channels: Array<Pick<ChatChannel, 'id' | 'last_message_at'>>,
) {
    return useQueries({
        queries: channels.map((channel) => ({
            queryKey: dmKeys.lastMessageVersion(account ?? '__signed-out__', channel.id, channel.last_message_at),
            queryFn: () =>
                getChatMessages(account as string, { channelId: channel.id, limit: 1 }).then(
                    (messages) => messages[0] ?? null,
                ),
            enabled: Boolean(account),
            staleTime: 30_000,
        })),
        combine: (queries) =>
            new Map(
                queries.flatMap((query, index) => {
                    const channelId = channels[index]?.id;
                    return channelId && query.data ? [[channelId, query.data] as const] : [];
                }),
            ),
    });
}

export function useDmLatestMessages(account: string | undefined, channelId: string | undefined) {
    return useQuery({
        queryKey: dmKeys.lastMessage(account ?? '__signed-out__', channelId ?? '__none__'),
        // Fetch a window rather than a single message so a burst of inbound messages arriving
        // between polls is not dropped — flattenMessages dedupes and merges them into the thread.
        queryFn: () =>
            getChatMessages(account as string, { channelId: channelId as string, limit: CHAT_MESSAGE_PAGE_LIMIT }),
        enabled: Boolean(account && channelId),
        refetchInterval: DM_MESSAGES_REFETCH_INTERVAL_MS,
        refetchIntervalInBackground: false,
    });
}

export function useDmMessages(account: string | undefined, channelId: string | undefined) {
    return useInfiniteQuery({
        queryKey: dmKeys.messages(account ?? '__signed-out__', channelId ?? '__none__'),
        enabled: Boolean(account && channelId),
        queryFn: ({ pageParam }) =>
            getChatMessages(account as string, {
                channelId: channelId as string,
                cursor: pageParam,
                limit: CHAT_MESSAGE_PAGE_LIMIT,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, _pages, lastPageParam) =>
            lastPage.length === CHAT_MESSAGE_PAGE_LIMIT ? lastPageParam + CHAT_MESSAGE_PAGE_LIMIT : undefined,
    });
}

export function flattenMessages(pages: ChatMessage[][] | undefined): ChatMessage[] {
    return dedupeByIdAndSort(
        (pages ?? []).flat(),
        (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );
}

export function getChannelUnreadCount(data: InfiniteData<ChatChannel[], number> | undefined, channelId: string) {
    if (!data) return 0;
    return Math.max(
        0,
        ...data.pages.flatMap((page) =>
            page
                .filter((channel) => channel.id === channelId)
                .map((channel) => channel.channel_membership.unread_count),
        ),
    );
}

export function markChannelRead(
    data: InfiniteData<ChatChannel[], number> | undefined,
    channelId: string,
    messageId?: string,
): InfiniteData<ChatChannel[], number> | undefined {
    if (!data) return data;

    let hasUnreadChannel = false;
    const pages = data.pages.map((page) =>
        page.map((channel) => {
            if (channel.id !== channelId || channel.channel_membership.unread_count === 0) return channel;
            hasUnreadChannel = true;
            return {
                ...channel,
                channel_membership: {
                    ...channel.channel_membership,
                    unread_count: 0,
                    last_read_message_id: messageId ?? channel.channel_membership.last_read_message_id,
                },
            };
        }),
    );
    return hasUnreadChannel ? { ...data, pages } : data;
}

export function getChannelUnreadCountAcrossQueries(
    queries: Array<InfiniteData<ChatChannel[], number> | undefined>,
    channelId: string,
    fallback = 0,
) {
    return Math.max(fallback, 0, ...queries.map((data) => getChannelUnreadCount(data, channelId)));
}

export function markCountersRead(counters: ChannelCounters | null | undefined, unreadCount: number, isRequest = false) {
    if (!counters || unreadCount === 0) return counters;
    return {
        ...counters,
        total_unread_count: Math.max(0, counters.total_unread_count - unreadCount),
        // Message requests are tracked under requests_count, not the DM/channel unread counters, so
        // reading one must not decrement those — doing so under-counts real unread DMs in the sidebar.
        total_unread_channels_count: isRequest
            ? counters.total_unread_channels_count
            : Math.max(0, counters.total_unread_channels_count - 1),
        total_unread_dms_count: isRequest
            ? counters.total_unread_dms_count
            : Math.max(0, counters.total_unread_dms_count - 1),
    };
}

interface SendMessageVariables {
    content: string;
    messageId: string;
    attachments: DmAttachmentDraft[];
}

async function uploadDmVideoCover(file: File) {
    const cover = await new Promise<Blob | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), VIDEO_COVER_TIMEOUT_MS);
        void generateVideoCover(file, 4).then(
            (covers) => {
                clearTimeout(timeout);
                resolve(covers[1] ?? covers[0] ?? null);
            },
            () => {
                clearTimeout(timeout);
                resolve(null);
            },
        );
    });
    if (!cover) return null;

    const coverFile = new File([cover], `${file.name}-cover`, { type: cover.type || 'image/jpeg' });
    return uploadToS3(coverFile, 'dm');
}

function createOptimisticMessage(
    channelId: string,
    content: string,
    messageId: string,
    author: UserMetadata,
    attachments: DmAttachmentDraft[],
): ChatMessage {
    const now = new Date().toISOString();
    return {
        id: messageId,
        channel_id: channelId,
        author_id: author.address,
        content: content || null,
        parent_message_id: null,
        created_at: now,
        updated_at: now,
        sticker_id: null,
        shared_publication_id: null,
        offer_id: null,
        sale_id: null,
        interactive_action_id: null,
        author_profile: author,
        attachments: attachments.map((attachment, index) => createDmAttachment(attachment, index)),
        send_status: 'pending',
        is_optimistic: true,
        pending_attachments: attachments,
    };
}

export function resolveSentDmMessage(
    optimisticMessage: ChatMessage,
    message: ChatMessage | null,
    attachments: ChatMessage['attachments'],
): ChatMessage {
    return {
        ...optimisticMessage,
        ...message,
        attachments: message?.attachments.length ? message.attachments : attachments,
        pending_attachments: undefined,
        send_status: 'sent',
        is_optimistic: false,
    };
}

export function useSendDmMessage(account: string, channelId: string, author: UserMetadata) {
    const queryClient = useQueryClient();
    const queryKey = dmKeys.messages(account, channelId);

    return useMutation({
        mutationKey: [...dmKeys.root(account), 'send-message', channelId],
        mutationFn: async ({ content, messageId, attachments: drafts }: SendMessageVariables) => {
            const attachments = await Promise.all(
                drafts.map(async (draft, index) => {
                    if (!draft.file) return createDmAttachment(draft, index);

                    const videoUpload = uploadToS3(draft.file, 'dm');
                    const coverUpload = draft.type.startsWith('video/')
                        ? uploadDmVideoCover(draft.file).catch(() => null)
                        : Promise.resolve(null);
                    const [url, cover] = await Promise.all([videoUpload, coverUpload]);
                    return createDmAttachment(draft, index, url, cover);
                }),
            );
            const input = {
                channelId,
                content: content.trim() || undefined,
                messageId,
                attachments,
            };
            try {
                const message = await sendMessage(account, input);
                return { attachments, message };
            } catch (error) {
                if (
                    !(error instanceof ChatApiError) ||
                    error.route !== 'send-message' ||
                    !attachments.some((attachment) => attachment.__typename === 'MediaVideo')
                ) {
                    throw error;
                }

                // Reuse the message ID so Orb can deduplicate a request that failed after persistence.
                const compatibleAttachments = attachments.map(toDmVideoCompatibilityAttachment);
                const message = await sendMessage(account, { ...input, attachments: compatibleAttachments });
                return { attachments, message };
            }
        },
        onMutate: async ({ content, messageId, attachments }) => {
            await queryClient.cancelQueries({ queryKey });
            const optimisticMessage = createOptimisticMessage(
                channelId,
                content.trim(),
                messageId,
                author,
                attachments,
            );
            queryClient.setQueryData<InfiniteData<ChatMessage[], number>>(queryKey, (data) => {
                if (!data) return { pages: [[optimisticMessage]], pageParams: [0] };
                const pages = data.pages.map((page, index) => (index ? page : [...page, optimisticMessage]));
                return { ...data, pages };
            });
            return { messageId };
        },
        onSuccess: ({ attachments, message }, variables, context) => {
            queryClient.setQueryData<InfiniteData<ChatMessage[], number>>(queryKey, (data) => {
                if (!data) return data;
                return {
                    ...data,
                    pages: data.pages.map((page) =>
                        page.map((item) =>
                            item.id === context.messageId ? resolveSentDmMessage(item, message, attachments) : item,
                        ),
                    ),
                };
            });

            for (const attachment of variables.attachments) {
                if (attachment.file) URL.revokeObjectURL(attachment.url);
            }
        },
        onError: (error, variables, context) => {
            queryClient.setQueryData<InfiniteData<ChatMessage[], number>>(queryKey, (data) => {
                if (!data) return data;
                return {
                    ...data,
                    pages: data.pages.map((page) =>
                        page.map((item) =>
                            item.id === context?.messageId ? { ...item, send_status: 'failed' } : item,
                        ),
                    ),
                };
            });
            const hasVideo = variables.attachments.some((attachment) => attachment.type.startsWith('video/'));
            const message = hasVideo
                ? error instanceof ChatApiError
                    ? t`This video could not be processed. Try an MP4 video under 50 MB.`
                    : t`Failed to upload video. Please try again.`
                : t`Failed to send message. Please try again.`;
            enqueueErrorMessage(message, { error });
        },
        onSettled: (_data, error) => {
            if (error) return;

            void queryClient.invalidateQueries({ queryKey });
            void queryClient.invalidateQueries({ queryKey: [...dmKeys.root(account), 'channels'] });
            void queryClient.invalidateQueries({ queryKey: dmKeys.counters(account) });
            void queryClient.invalidateQueries({ queryKey: dmKeys.lastMessage(account, channelId) });
        },
    });
}

export function useDmInteractiveAction(account: string, id: string) {
    return useQuery({
        queryKey: dmKeys.interactiveAction(account, id),
        queryFn: () => getInteractiveAction(account, id),
        staleTime: 5 * 60_000,
        retry: 1,
    });
}

export function useMarkDmRead(account: string, channelId: string, unreadCountHint = 0, isRequest = false) {
    const queryClient = useQueryClient();

    return useCallback(
        async (messageId: string) => {
            const channelsQueryKey = [...dmKeys.root(account), 'channels'] as const;
            await Promise.all([
                queryClient.cancelQueries({ queryKey: channelsQueryKey }),
                queryClient.cancelQueries({ queryKey: dmKeys.counters(account) }),
            ]);

            const channelSnapshots = queryClient.getQueriesData<InfiniteData<ChatChannel[], number>>({
                queryKey: channelsQueryKey,
            });
            const countersQueryKey = dmKeys.counters(account);
            const countersSnapshot = queryClient.getQueryData<ChannelCounters | null>(countersQueryKey);
            const unreadCount = getChannelUnreadCountAcrossQueries(
                channelSnapshots.map(([, data]) => data),
                channelId,
                unreadCountHint,
            );
            queryClient.setQueriesData<InfiniteData<ChatChannel[], number>>({ queryKey: channelsQueryKey }, (data) =>
                markChannelRead(data, channelId, messageId),
            );
            queryClient.setQueryData<ChannelCounters | null>(countersQueryKey, (counters) =>
                markCountersRead(counters, unreadCount, isRequest),
            );

            try {
                await markMessageAsRead(account, channelId, messageId);
            } catch (error) {
                for (const [queryKey, data] of channelSnapshots) {
                    queryClient.setQueryData(queryKey, data);
                }

                queryClient.setQueryData(countersQueryKey, countersSnapshot);
                void queryClient.invalidateQueries({ queryKey: channelsQueryKey });
                void queryClient.invalidateQueries({ queryKey: countersQueryKey });
                throw error;
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: channelsQueryKey, refetchType: 'none' }),
                queryClient.invalidateQueries({ queryKey: countersQueryKey, refetchType: 'none' }),
            ]);
        },
        [account, channelId, isRequest, queryClient, unreadCountHint],
    );
}

export function useDmProfileSearch(account: string | undefined, query: string) {
    const normalizedQuery = query.trim();
    return useQuery<MentionResult[]>({
        queryKey: dmKeys.search(account ?? '__signed-out__', normalizedQuery),
        queryFn: () => searchProfiles(account as string, normalizedQuery),
        enabled: Boolean(account && normalizedQuery.length >= 2),
        staleTime: 30_000,
    });
}

export function useStartDmChat(account: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: [...dmKeys.root(account), 'start-chat'],
        mutationFn: async (targetUserId: string) => {
            const channelId = await createChat(account, targetUserId);
            const channel = await getChatChannel(account, channelId);
            if (!channel) throw new ChatApiError('get-chat-channel returned no channel', 'get-chat-channel');
            return channel;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: dmKeys.root(account) }),
    });
}
