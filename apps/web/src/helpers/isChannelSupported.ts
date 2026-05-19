import { SUPPORTED_CHANNEL_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';

export function isChannelSupported(source?: SocialSource) {
    if (!source) return false;
    return SUPPORTED_CHANNEL_SOURCES.includes(source);
}
