import { createLookupTableResolver , UnreachableError } from '@dimensiondev/utils';

import { Source } from '@/constants/enum.js';
import type { BlockFields } from '@/providers/types/Firefly.js';

export const getPlatformQueryKey = createLookupTableResolver<Source, BlockFields>(
    {
        [Source.Twitter]: 'twitterId',
        [Source.Lens]: 'lensId',
        [Source.Farcaster]: 'fid',
        [Source.Wallet]: 'address',
    } as Record<Source, BlockFields>,
    (source: Source) => {
        throw new UnreachableError('Unsupported source', source);
    },
);
