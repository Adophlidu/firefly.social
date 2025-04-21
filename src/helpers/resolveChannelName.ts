import { Source } from '@/constants/enum.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export function resolveChannelName(channel: Channel, channelPrefix = true) {
    const prefix = channel.source === Source.Lens ? '#' : '/';

    return channel.name ? `${channelPrefix ? prefix : ''}${channel.name}` : '';
}
