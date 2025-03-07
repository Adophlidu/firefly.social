import { type SocialSource } from '@/constants/enum.js';
import { SUPPORTED_CHANNEL_SOURCES } from '@/constants/index.js';

export function isChannelSupported(source?: SocialSource) {
    if (!source) return false;
    return SUPPORTED_CHANNEL_SOURCES.includes(source);
}
