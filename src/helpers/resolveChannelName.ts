import type { Channel } from '@/providers/types/SocialMedia.js';

export function resolveChannelName(channel: Channel, channelPrefix = true) {
    return channel.name
        ? `${channelPrefix ? '/' : ''}${channel.name}`
        : channel.group?.name
          ? `#${channel.group.name}`
          : '';
}
