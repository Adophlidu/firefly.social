import { ChatApiError, createChat, getChatChannel, getChatChannelByUser } from '@/providers/orb/chat/api.js';
import type { ChatChannel } from '@/providers/orb/chat/types.js';

function normalizeAccount(value: string) {
    return value.trim().toLowerCase();
}

async function getOrCreateDmChannel(account: string, targetAccount: string) {
    const existingChannel = await getChatChannelByUser(account, targetAccount);
    if (existingChannel) return existingChannel;

    const channelId = await createChat(account, targetAccount);
    const channel = await getChatChannel(account, channelId);
    if (!channel) throw new ChatApiError('get-chat-channel returned no channel', 'get-chat-channel');
    return channel;
}

const pendingChannelResolutions = new Map<string, Promise<ChatChannel>>();

export function resolveDmChannel(account: string, targetAccount: string) {
    const key = `${normalizeAccount(account)}:${normalizeAccount(targetAccount)}`;
    const pendingResolution = pendingChannelResolutions.get(key);
    if (pendingResolution) return pendingResolution;

    const resolution = getOrCreateDmChannel(account, targetAccount);
    pendingChannelResolutions.set(key, resolution);
    void resolution.then(
        () => pendingChannelResolutions.delete(key),
        () => pendingChannelResolutions.delete(key),
    );
    return resolution;
}
