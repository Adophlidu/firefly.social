import { compact } from 'lodash-es';

import { type SocialSource, Source } from '@/constants/enum.js';
import { mergeLists } from '@/helpers/mergeLists.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';

const fixedChannelConfig: Partial<Record<SocialSource, string[]>> = {
    [Source.Farcaster]: ['firefly-garden'],
    [Source.Lens]: ['orb', 'defi', 'lens'],
};

async function getTrendingChannelsBySource(source: SocialSource, count: number) {
    const provider = resolveSocialMediaProvider(source);

    const channelIds = fixedChannelConfig[source] || [];
    const fixedChannels = channelIds.length ? await provider.getChannelsByIds(channelIds) : [];
    const restCount = count - fixedChannels.length;
    const restChannels = restCount > 0 ? (await provider.discoverChannels()).data : [];

    return [...fixedChannels, ...restChannels].slice(0, count);
}

export async function getTrendingChannels(sources: SocialSource[], countForEachSource = 3) {
    const result = await Promise.allSettled(
        sources.map((source) => getTrendingChannelsBySource(source, countForEachSource)),
    );
    return mergeLists(...compact(result.map((x) => (x.status === 'fulfilled' ? x.value : null))));
}
