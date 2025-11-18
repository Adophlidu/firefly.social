/* cspell:disable */

import { CharTag, FireflyPlatform } from '@/constants/enum.js';
import type { Profile } from '@/providers/types/Firefly.js';
import type { MentionChars } from '@/types/chars.js';

export const FIREFLY_TWITTER_PROFILE: Profile = {
    platform_id: '1583361564479889408',
    platform: FireflyPlatform.Twitter,
    handle: 'thefireflyapp',
    name: 'thefireflyapp',
    hit: true,
    score: 0,
};

export const FIREFLY_FARCASTER_PROFILE: Profile = {
    platform_id: '16823',
    platform: FireflyPlatform.Farcaster,
    handle: 'fireflyapp',
    name: 'Firefly App',
    hit: true,
    score: 0,
};

export const FIREFLY_LENS_PROFILE: Profile = {
    platform_id: '0x01b000',
    platform: FireflyPlatform.Lens,
    handle: 'fireflyapp',
    name: 'fireflyapp',
    hit: true,
    score: 0,
};

export const FIREFLY_BSKY_PROFILE: Profile = {
    platform_id: 'did:plc:i6lchnoqz37rdwxg4mipfgq5',
    platform: FireflyPlatform.Bsky,
    handle: 'fireflyapp.bsky.social',
    name: 'fireflyapp',
    hit: true,
    score: 0,
};

export const FIREFLY_MENTION = {
    tag: CharTag.MENTION,
    visible: true,
    content: `@thefireflyapp`,
    profiles: [FIREFLY_TWITTER_PROFILE, FIREFLY_FARCASTER_PROFILE, FIREFLY_LENS_PROFILE, FIREFLY_BSKY_PROFILE],
} satisfies MentionChars;

export const TRUMP_TWITTER_PROFILE: Profile = {
    platform_id: '25073877',
    platform: FireflyPlatform.Twitter,
    handle: 'realDonaldTrump',
    name: 'realDonaldTrump',
    hit: true,
    score: 0.07142878,
};
