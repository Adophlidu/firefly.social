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
