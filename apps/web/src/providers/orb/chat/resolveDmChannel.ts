import { ChatApiError, createChat, getChatChannel, getChatChannels } from '@/providers/orb/chat/api.js';
import { CHAT_CHANNEL_PAGE_LIMIT } from '@/providers/orb/chat/constants.js';
import type { ChatChannel } from '@/providers/orb/chat/types.js';

function normalizeAccount(value: string) {
    return value.trim().toLowerCase();
}

export function isDmChannelForTarget(channel: ChatChannel, targetAccount: string) {
    const target = normalizeAccount(targetAccount);
    const profile = channel.other_member_profile;
    return [profile?.address, profile?.id].some((value) => value && normalizeAccount(value) === target);
}

async function findDmChannel(account: string, targetAccount: string) {
    let cursor = 0;

    while (true) {
        const channels = await getChatChannels(account, { type: 'dm', cursor });
        const existingChannel = channels.find((channel) => isDmChannelForTarget(channel, targetAccount));
        if (existingChannel) return existingChannel;
        if (channels.length < CHAT_CHANNEL_PAGE_LIMIT) return null;
        cursor += CHAT_CHANNEL_PAGE_LIMIT;
    }
}

async function getOrCreateDmChannel(account: string, targetAccount: string) {
    const existingChannel = await findDmChannel(account, targetAccount);
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
