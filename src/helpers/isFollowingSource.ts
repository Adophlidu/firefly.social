import type { DiscoverSource } from '@/constants/enum.js';
import { FOLLOWING_SOURCES } from '@/constants/index.js';

export function isFollowingSource(source: string): source is DiscoverSource {
    return (FOLLOWING_SOURCES as string[]).includes(source);
}
