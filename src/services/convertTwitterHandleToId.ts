import { KeyType } from '@/constants/enum.js';
import { MalformedError } from '@/constants/error.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export const convertTwitterHandleToId = memoizeWithRedis(
    async (twitterId: string) => {
        const data = await FireflyEndpointProvider.getAllRelatedProfiles({ twitterId });
        const username = data.twitterProfiles?.[0]?.handle;
        if (!username) throw new MalformedError('username not found');
        return username;
    },
    {
        key: KeyType.TwitterHandleToUid,
    },
);
