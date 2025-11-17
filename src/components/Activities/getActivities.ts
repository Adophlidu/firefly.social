import { safeUnreachable } from '@dimensiondev/utils';
import { compact } from 'lodash-es';

import { resolveArticlePlatform } from '@/components/Activities/resolveArticlePlatform.js';
import { ActivitiesPlatform, Source } from '@/constants/enum.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { discoverArticles } from '@/providers/firefly/article/discoverArticles.js';
import { discoverArticlesByAddress } from '@/providers/firefly/article/discoverArticlesByAddress.js';
import { getFollowingArticles } from '@/providers/firefly/article/getFollowingArticles.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type { Article, ArticlePlatform } from '@/providers/types/Article.js';
import type { ActivitiesItem, FollowingSnapshotActivity } from '@/providers/types/Firefly.js';

function createActivitiesFetcher(
    fetchArticles: (
        indicator?: PageIndicator,
        platform?: ArticlePlatform[],
    ) => Promise<Pageable<Article, PageIndicator>>,
    fetchSnapshots: (indicator?: PageIndicator) => Promise<Pageable<FollowingSnapshotActivity, PageIndicator>>,
) {
    return async function fetchActivities(
        source: ActivitiesItem['source'],
        platforms?: ActivitiesPlatform[],
        pageParam?: string,
        connectedAddress?: string,
    ) {
        switch (source) {
            case Source.Article: {
                if (platforms?.includes(ActivitiesPlatform.Snapshot)) {
                    return createPageable([], createIndicator(undefined, pageParam));
                }

                const result = await fetchArticles(
                    createIndicator(undefined, pageParam),
                    compact(platforms ? platforms.map((x) => resolveArticlePlatform(x)) : []),
                );
                return {
                    ...result,
                    data: result.data.map((item) => ({
                        source,
                        data: item,
                        id: item.id,
                        timestamp: new Date(item.timestamp).getTime(),
                    })),
                };
            }
            case Source.DAOs: {
                if (platforms?.length && !platforms.includes(ActivitiesPlatform.Snapshot)) {
                    return createPageable([], createIndicator(undefined, pageParam));
                }

                const result = await fetchSnapshots(createIndicator(undefined, pageParam));
                return {
                    ...result,
                    data: result.data.map((item) => ({
                        source,
                        data: item,
                        id: item.id,
                        timestamp: item.timestamp,
                    })),
                };
            }
            default:
                safeUnreachable(source);
                return createPageable([], createIndicator(undefined, pageParam));
        }
    };
}

export const getFollowingActivities = createActivitiesFetcher(
    (indicator, platforms) => getFollowingArticles(indicator, platforms),
    (indicator) => FireflySocialMediaProvider.getFollowingSnapshotActivity({ indicator }),
);

export const getForYouActivities = createActivitiesFetcher(
    (indicator, platforms) => discoverArticles(indicator, platforms),
    (indicator) => FireflySocialMediaProvider.discoverSnapshotActivity(indicator),
);

export function getProfileActivities(
    source: ActivitiesItem['source'],
    addresses: string[],
    platforms: ActivitiesPlatform[],
    pageParam?: string,
    connectedAddress?: string,
) {
    return createActivitiesFetcher(
        (indicator, platform) => discoverArticlesByAddress(addresses, indicator, platform),
        (indicator) =>
            FireflySocialMediaProvider.getFollowingSnapshotActivity({
                indicator,
                walletAddresses: addresses,
            }),
    )(source, platforms || [], pageParam, connectedAddress);
}
