import type { FireflyPlatform } from '@/constants/enum.js';
import { getPlatformQueryKey } from '@/helpers/getPlatformQueryKey.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { block } from '@/providers/firefly/endpoint/block.js';

export async function blockProfileFor(source: FireflyPlatform, profileId: string): Promise<boolean> {
    return block(getPlatformQueryKey(resolveSourceFromUrl(source)), profileId);
}
