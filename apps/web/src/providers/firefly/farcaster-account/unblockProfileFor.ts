import type { FireflyPlatform } from '@dimensiondev/enums';

import { getPlatformQueryKey } from '@/helpers/getPlatformQueryKey.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { unblock } from '@/providers/firefly/endpoint/unblock.js';

export async function unblockProfileFor(source: FireflyPlatform, profileId: string): Promise<boolean> {
    return unblock(getPlatformQueryKey(resolveSourceFromUrl(source)), profileId);
}
