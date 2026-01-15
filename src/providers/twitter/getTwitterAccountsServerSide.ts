import { kv } from '@vercel/kv';
import { compact } from 'lodash-es';

import { KeyType } from '@/constants/enum.js';
import type { SocialAccountTwitter } from '@/types/sync.js';

export async function getTwitterAccountsServerSide(accounts: SocialAccountTwitter[]): Promise<SocialAccountTwitter[]> {
    const promises = await Promise.allSettled(
        accounts.map(async (account) => {
            const secret = await kv.hget<string>(KeyType.ConsumerSecret, account.consumerKey);
            if (!secret) return null;
            return { ...account, consumerKeySecret: secret };
        }),
    );
    return compact(promises.filter((p) => p.status === 'fulfilled').map((p) => p.value));
}
