import { SessionType, Source } from '@dimensiondev/enums';

import { FetchError } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { updateCurrentSessionToStorage } from '@/helpers/updateCurrentSessionToStorage.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { CHAT_CHANNEL_PAGE_LIMIT, CHAT_MESSAGE_PAGE_LIMIT } from '@/providers/orb/chat/constants.js';
import { isSameDmAccount } from '@/providers/orb/chat/isSameDmAccount.js';
import type {
    ChannelCounters,
    ChannelMembership,
    ChatChannel,
    ChatEnvelope,
    ChatItemsPage,
    ChatMessage,
    ChatRealtimeSession,
    CreateDirectTipInput,
    GetChannelsParams,
    GetMessagesParams,
    InteractiveActionDetail,
    MentionResult,
    SendMessageInput,
    UserMetadata,
} from '@/providers/orb/chat/types.js';

export class DmAuthenticationError extends Error {
    override name = 'DmAuthenticationError';
}

export class ChatApiError extends Error {
    override name = 'ChatApiError';

    constructor(
        message: string,
        public route: string,
    ) {
        super(message);
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value && typeof value === 'object' && !Array.isArray(value));

const stringOrNull = (value: unknown) => (typeof value === 'string' && value ? value : null);
const normalizeLensAccount = (value: string) => value.trim().toLowerCase();

const isExpiredAuthMessage = (message: string | undefined) =>
    /expired auth|unauthorized|unauthenticated|invalid token|token expired/i.test(message ?? '');

function normalizeChatMessage(message: ChatMessage): ChatMessage {
    const rawMessage = message as ChatMessage & {
        attachments?: ChatMessage['attachments'];
        author?: UserMetadata;
    };
    const messageWithAuthor =
        !message.author_profile && rawMessage.author ? { ...message, author_profile: rawMessage.author } : message;
    return { ...messageWithAuthor, attachments: rawMessage.attachments ?? [] };
}

// Some Orb endpoints (notably get-chat-channel for a freshly created 1:1 chat) can return a channel
// without a channel_membership object. Downstream code dereferences it unconditionally, so guarantee
// the shape at the boundary with a neutral default rather than scattering null-guards everywhere.
const EMPTY_CHANNEL_MEMBERSHIP: ChannelMembership = {
    id: '',
    channel_id: '',
    user_id: null,
    role: '',
    status: '',
    is_pinned: false,
    is_muted: false,
    is_hidden: false,
    is_marked_as_spam: false,
    chat_request_type: null,
    unread_count: 0,
    last_read_message_id: null,
    created_at: '',
    updated_at: '',
};

function normalizeChatChannel(channel: ChatChannel): ChatChannel {
    const rawChannel = channel as ChatChannel & { channel_membership?: ChannelMembership | null };
    return {
        ...channel,
        channel_membership: rawChannel.channel_membership ?? EMPTY_CHANNEL_MEMBERSHIP,
        last_message: channel.last_message ? normalizeChatMessage(channel.last_message) : channel.last_message,
    };
}

// DM authenticates with the global Lens session token — the same one the Lens SDK maintains and
// auto-refreshes — instead of a separate Orb sign-in. Read it straight from storage, which the SDK
// keeps current (SessionStorageProvider.setItem writes refreshed tokens back).
function getActiveLensSession(account: string): LensSession {
    const session = getSessionFromStorage(SessionType.Lens);
    if (!session) throw new DmAuthenticationError('No active Lens session.');
    if (session.address.toLowerCase() !== account.toLowerCase()) {
        throw new DmAuthenticationError('The active Lens account changed.');
    }
    return session;
}

// Force a Lens token refresh and persist it so the next request (and the rest of the app) picks up
// the new token. Mirrors createLensSessionClient's retryOnAutoRefreshError recovery path.
async function refreshActiveLensSession(account: string): Promise<LensSession | null> {
    try {
        const refreshed = await refreshLensSession(getActiveLensSession(account));
        updateCurrentSessionToStorage(Source.Lens, refreshed);
        return refreshed;
    } catch {
        return null;
    }
}

// Renew an expired Lens token once and replay the request. If the refresh is spent or fails, raise
// an auth error so the UI surfaces the expired session instead of a generic failure.
async function renewExpiredLensSession<T>(
    account: string,
    action: string,
    body: Record<string, unknown>,
    hasRetried: boolean,
): Promise<ChatEnvelope<T>> {
    if (!hasRetried) {
        const refreshed = await refreshActiveLensSession(account);
        if (refreshed) return postOrb<T>(account, action, body, true);
    }
    throw new DmAuthenticationError('The Lens session expired.');
}

async function postOrb<T>(
    account: string,
    action: string,
    body: Record<string, unknown>,
    hasRetried = false,
): Promise<ChatEnvelope<T>> {
    const session = getActiveLensSession(account);

    try {
        const payload = await fetchJson<ChatEnvelope<T>>(`/api/orb/chat/${action}`, {
            method: 'POST',
            headers: {
                'x-access-token': `Bearer ${session.token.replace(/^Bearer\s+/iu, '')}`,
            },
            body: JSON.stringify(body),
        });

        if (payload.status === 'FAILED' && isExpiredAuthMessage(payload.msg)) {
            return renewExpiredLensSession<T>(account, action, body, hasRetried);
        }

        return payload;
    } catch (error) {
        if (error instanceof FetchError && error.status === 401) {
            return renewExpiredLensSession<T>(account, action, body, hasRetried);
        }
        throw error;
    }
}

function unwrapChatEnvelope<T>(route: string, payload: ChatEnvelope<T>): T | undefined {
    if (payload.status === 'FAILED') throw new ChatApiError(payload.msg ?? `${route} failed`, route);
    return payload.data;
}

export async function getChatChannels(account: string, params: GetChannelsParams = {}): Promise<ChatChannel[]> {
    const { cursor = 0, limit = CHAT_CHANNEL_PAGE_LIMIT, ...rest } = params;
    const payload = await postOrb<ChatItemsPage<ChatChannel>>(account, 'get-chat-channels', { cursor, limit, ...rest });
    return (unwrapChatEnvelope('get-chat-channels', payload)?.items ?? []).map(normalizeChatChannel);
}

export async function getChatChannel(account: string, channelId: string): Promise<ChatChannel | null> {
    const payload = await postOrb<ChatChannel>(account, 'get-chat-channel', { channelId });
    const channel = unwrapChatEnvelope('get-chat-channel', payload);
    return channel ? normalizeChatChannel(channel) : null;
}

export async function getChatChannelByUser(account: string, otherUserId: string): Promise<ChatChannel | null> {
    const payload = await postOrb<ChatChannel>(account, 'get-chat-channel', {
        otherUserId: normalizeLensAccount(otherUserId),
    });
    const channel = unwrapChatEnvelope('get-chat-channel', payload);
    return channel ? normalizeChatChannel(channel) : null;
}

export async function getChatMessages(account: string, params: GetMessagesParams): Promise<ChatMessage[]> {
    const { channelId, cursor = 0, limit = CHAT_MESSAGE_PAGE_LIMIT } = params;
    const payload = await postOrb<ChatItemsPage<ChatMessage>>(account, 'get-chat-messages', {
        channelId,
        cursor,
        limit,
    });
    return (unwrapChatEnvelope('get-chat-messages', payload)?.items ?? []).map(normalizeChatMessage);
}

export async function getChannelCounters(account: string): Promise<ChannelCounters | null> {
    const payload = await postOrb<ChannelCounters>(account, 'get-channel-counters', {});
    return unwrapChatEnvelope('get-channel-counters', payload) ?? null;
}

export async function createChatRealtimeSession(account: string): Promise<ChatRealtimeSession> {
    const payload = await postOrb<ChatRealtimeSession>(account, 'create-chat-realtime-session', {});
    const session = unwrapChatEnvelope('create-chat-realtime-session', payload);
    if (!session?.token || !session.supabaseUrl || !session.supabaseAnonKey) {
        throw new ChatApiError(
            'create-chat-realtime-session returned an invalid session',
            'create-chat-realtime-session',
        );
    }
    return session;
}

export async function getInteractiveAction(account: string, interactiveActionId: string) {
    const payload = await postOrb<InteractiveActionDetail | null>(account, 'get-interactive-action', {
        interactiveActionId,
    });
    return unwrapChatEnvelope('get-interactive-action', payload) ?? null;
}

export async function createDirectTipInteractiveAction(account: string, input: CreateDirectTipInput) {
    const { message, ...tip } = input;
    const payload = await postOrb<{ id?: string }>(account, 'interactive-actions', {
        task: 'create',
        type: 'DIRECT_TIP',
        ...tip,
        metadata: {
            source: 'messageInChat',
            message: message ?? '',
        },
        availability: 'PUBLIC',
    });
    const data = unwrapChatEnvelope('interactive-actions', payload);
    const interactiveActionId = data?.id;
    if (!interactiveActionId) throw new ChatApiError('interactive-actions returned no id', 'interactive-actions');
    return interactiveActionId;
}

export async function completeInteractiveAction(account: string, interactiveActionId: string) {
    const payload = await postOrb(account, 'interactive-actions', {
        task: 'edit',
        interactiveActionId,
        status: 'COMPLETED',
    });
    unwrapChatEnvelope('interactive-actions', payload);
}

export async function createChat(account: string, targetUserId: string): Promise<string> {
    if (isSameDmAccount(account, targetUserId)) throw new ChatApiError('Cannot send message to self', 'create-chat');

    const payload = await postOrb<{ channelId?: string }>(account, 'create-chat', {
        targetUserId: normalizeLensAccount(targetUserId),
    });
    unwrapChatEnvelope('create-chat', payload);
    const channelId = payload.channelId ?? payload.data?.channelId;
    if (!channelId) throw new ChatApiError('create-chat returned no channelId', 'create-chat');
    return channelId;
}

export async function sendMessage(account: string, input: SendMessageInput): Promise<ChatMessage | null> {
    const payload = await postOrb<ChatMessage>(account, 'send-message', { sendFcm: true, ...input });
    const message = unwrapChatEnvelope('send-message', payload);
    return message ? normalizeChatMessage(message) : null;
}

export async function markMessageAsRead(account: string, channelId: string, messageId: string): Promise<void> {
    const payload = await postOrb(account, 'mark-message-as-read', { channelId, messageId });
    unwrapChatEnvelope('mark-message-as-read', payload);
}

function parseMention(item: unknown): MentionResult | null {
    const record = isRecord(item) ? item : null;
    const metadata = isRecord(record?.metadata) ? record.metadata : null;
    const handle = stringOrNull(metadata?.handle);
    if (!record || !handle) return null;

    const picture = metadata?.picture;
    const avatar = typeof picture === 'string' ? picture : isRecord(picture) ? stringOrNull(picture.url) : null;

    return {
        id: stringOrNull(record.id) ?? stringOrNull(metadata?.address) ?? handle,
        handle,
        name: stringOrNull(metadata?.name),
        avatar,
    };
}

export async function searchProfiles(account: string, query: string): Promise<MentionResult[]> {
    const payload = await postOrb<ChatItemsPage<unknown>>(account, 'search', {
        query,
        searchType: 'USER',
        limit: 10,
        cursor: '0',
        sortFilter: 'RELEVANT',
        thumbnailDimension: 128,
    });

    return (unwrapChatEnvelope('search', payload)?.items ?? [])
        .map(parseMention)
        .filter((item): item is MentionResult => item !== null && !isSameDmAccount(account, item.id));
}
