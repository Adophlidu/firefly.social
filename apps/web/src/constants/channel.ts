import { Source } from '@dimensiondev/enums';

import { createDummyChannel } from '@/helpers/createDummyChannel.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export const HOME_CHANNEL: Channel = createDummyChannel(Source.Farcaster, 'home' /* fake id */, 'Home');

export const HOME_CLUB: Channel = createDummyChannel(Source.Lens, 'home' /* fake id */, 'Home');

export const FF_GARDEN_CHANNEL: Channel = {
    ...createDummyChannel(Source.Farcaster, 'firefly-garden'),
    imageUrl: 'https://i.imgur.com/NfzIpwa.jpg',
    url: 'https://farcaster.xyz/~/channel/firefly-garden',
    parentUrl: 'https://farcaster.xyz/~/channel/firefly-garden',
    timestamp: 1703399720,
};

/**
 * World Cup 2026 Lens group — the channel Orb (LPT-1) comments publish into.
 *
 * `feedId` is the group's *feed* address `group.feed.address` — NOT the group
 * address — because both the publish path (`publishLensPost` → `feed`) and the
 * posts query (`feeds: [{ feed }]`) take the feed address. The group address
 * itself returns zero posts.
 *
 * {@link WORLDCUP_2026_GROUP_ADDRESS} is the real group address, verified against
 * Lens mainnet (metadata.name "WorldCup2026", 341 members). The dummy `id`
 * `'worldcup-2026'` cannot drive a group join (`safeEvmAddress` rejects it), so
 * the join path uses the address constant instead.
 */
export const WORLDCUP_2026_GROUP_ADDRESS = '0x230c140a85af16aa444ba87e0823e5c62cfe3366';
export const WORLDCUP_2026_GROUP: Channel = {
    ...createDummyChannel(Source.Lens, 'worldcup-2026', 'WorldCup2026'),
    feedId: '0xc5D7EB16718F1F08315D0cd82349A408A881DB97',
};
