import { type SocialSource, Source } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

function sortChannels(list: Channel[][]) {
    const results: Channel[] = [];
    const maxLength = Math.max(...list.map((x) => x.length));
    let index = 0;

    while (index < maxLength) {
        for (const x of list) {
            if (index < x.length) {
                results.push(x[index]);
            }
        }
        index += 1;
    }

    return results;
}

export async function getSuggestedChannels(
    query: string,
    sources = [Source.Farcaster, Source.Lens, Source.Bsky] as SocialSource[],
    count = Math.min(sources.length, 2),
) {
    if (!query || !sources.length) return [];
    const results = await Promise.all(
        sources.map(async (source) => {
            if (source === Source.Twitter) return [];

            const provider = resolveSocialMediaProvider(source);
            const data = await runInSafeAsync(() => provider.searchChannels(query));
            return data?.data ?? [];
        }),
    );

    return sortChannels(results).slice(0, count);
}
