import { createLookupTableResolver } from '@dimensiondev/utils';

import { type ProfileSource, type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { thirdPartySessionHolder } from '@/providers/third-party/SessionHolder.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Session } from '@/providers/types/Session.js';

export const resolveSessionHolder = createLookupTableResolver<SocialSource, SessionHolder<Session>>(
    {
        [Source.Farcaster]: farcasterSessionHolder,
        [Source.Lens]: lensSessionHolder,
        [Source.Twitter]: twitterSessionHolder,
        [Source.Bsky]: bskySessionHolder,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const resolveSessionHolderFromProfileSource = createLookupTableResolver<ProfileSource, SessionHolder<Session>>(
    {
        [Source.Farcaster]: farcasterSessionHolder,
        [Source.Lens]: lensSessionHolder,
        [Source.Twitter]: twitterSessionHolder,
        [Source.Firefly]: fireflySessionHolder,
        [Source.Bsky]: bskySessionHolder,
        [Source.Google]: thirdPartySessionHolder,
        [Source.Apple]: thirdPartySessionHolder,
        [Source.Telegram]: thirdPartySessionHolder,
        [Source.Email]: thirdPartySessionHolder,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);
