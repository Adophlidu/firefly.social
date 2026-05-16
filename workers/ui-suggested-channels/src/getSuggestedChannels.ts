import type { SocialSource } from '@dimensiondev/workers-shared/constants/source.js';
import { Source } from '@dimensiondev/workers-shared/constants/source.js';
import { compact } from '@dimensiondev/workers-shared/helpers/compact.js';
import { fetchFireflyRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyRpc.js';
import { resolveSocialSourceInUrl } from '@dimensiondev/workers-shared/helpers/resolveSource.js';
import type { FireflyChannel } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import { mergeLists } from '@/ui-suggested-channels/src/mergeLists.js';

const suggestedLensGroups = [
    { name: 'orb', id: '0xB49d9dBbaC3aCbd5C263f5C204Ad9CF859f54869' },
    { name: 'defi', id: '0xEB8865c981F345c2F9E7d843b840ea2695cCC648' },
    { name: 'lens', id: '0xb2953F8f18A6E58187F721D10244fdCa12E42415' },
];
const fixedChannelConfig: Partial<Record<SocialSource, string[]>> = {
    [Source.Farcaster]: ['firefly-garden'],
    [Source.Lens]: suggestedLensGroups.map((x) => x.id),
};

async function getTrendingChannelsBySource(source: SocialSource, count: number, c: Context) {
    const source_ = resolveSocialSourceInUrl(source);
    const channelIds = fixedChannelConfig[source] || [];
    const fixedChannels = channelIds.length
        ? await fetchFireflyRpc<FireflyChannel[]>(source_, 'getChannelsByIds', { ids: channelIds }, c).catch(() => [])
        : [];
    const restCount = count - fixedChannels.length;
    const restChannels =
        restCount > 0
            ? await fetchFireflyRpc<{ data: FireflyChannel[] }>(source_, 'discoverChannels', {}, c)
                  .then((x) => x.data)
                  .catch(() => [])
            : [];
    return [...fixedChannels, ...restChannels].slice(0, count);
}

export async function getTrendingChannels(sources: SocialSource[], count: number, c: Context) {
    const result = await Promise.allSettled(sources.map((source) => getTrendingChannelsBySource(source, count, c)));
    return mergeLists(...compact(result.map((x) => (x.status === 'fulfilled' ? x.value : null))));
}
