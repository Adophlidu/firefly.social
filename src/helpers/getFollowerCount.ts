import { Source } from '@/constants/enum.js';
import type { FireflyProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function getFollowerCount(profile: FireflyProfile): number {
    if (!profile.__origin__) return 0;

    const source = profile.identity.source;

    try {
        switch (source) {
            case Source.Farcaster:
            case Source.Lens:
            case Source.Twitter:
            case Source.Bsky: {
                const socialProfile = profile.__origin__ as unknown as Profile;
                return socialProfile.followerCount ?? 0;
            }
            default:
                return 0;
        }
    } catch {
        return 0;
    }
}
