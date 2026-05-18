import type { SocialSource } from '@dimensiondev/enums';

import { SUPPORTED_CHANNEL_SOURCES } from '@/constants/computed.js';

export function isChannelSupported(source?: SocialSource) {
    if (!source) return false;
    return SUPPORTED_CHANNEL_SOURCES.includes(source);
}
