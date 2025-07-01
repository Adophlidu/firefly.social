import type { SocialSource } from '@/constants/enum.js';

export function createDummyChannel(source: SocialSource, id: string, name = id) {
    return {
        id,
        name,
        imageUrl: '',
        url: '',
        parentUrl: '',
        followerCount: 0,
        timestamp: Date.now(),
        source,
    };
}
