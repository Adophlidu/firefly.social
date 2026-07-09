import { HIDDEN_SECRET } from '@dimensiondev/constants/static';
import { KeyType } from '@dimensiondev/enums';
import { compact } from 'lodash-es';

import { redisReader } from '@/libs/Redis.js';
import type { SocialAccountTwitter } from '@/types/sync.js';

export async function getTwitterAccountsServerSide(accounts: SocialAccountTwitter[]): Promise<SocialAccountTwitter[]> {
    const promises = await Promise.allSettled(
        accounts.map(async (account) => {
            if (account.consumerKeySecret && account.consumerKeySecret !== HIDDEN_SECRET) return account;
            const secret = await redisReader.hget<string>(KeyType.ConsumerSecret, account.consumerKey);
            if (!secret) return null;
            return { ...account, consumerKeySecret: secret };
        }),
    );
    return compact(promises.filter((p) => p.status === 'fulfilled').map((p) => p.value));
}
