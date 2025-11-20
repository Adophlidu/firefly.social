import { EMPTY_LIST } from '@/constants/index.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { FarcasterAccountInfoResponse } from '@/providers/types/Firefly.js';

export async function getFarcasterAccountInfos() {
    const res = await fireflySessionHolder.fetchWithSession<FarcasterAccountInfoResponse>(
        '/api/firefly/farcaster-account-info',
    );
    return res.data || EMPTY_LIST;
}
