import { resolveArticlePlatform } from '@/components/Activities/resolveArticlePlatform.js';
import { ActivitiesPlatform, Source } from '@/constants/enum.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { FireflyArticleProvider } from '@/providers/firefly/Article.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type { Article, ArticlePlatform } from '@/providers/types/Article.js';
import type { ActivitiesItem, FollowingSnapshotActivity } from '@/providers/types/Firefly.js';

function createActivitiesFetcher(
    fetchArticles: (indicator?: PageIndicator, platform?: ArticlePlatform) => Promise<Pageable<Article, PageIndicator>>,
    fetchSnapshots: (
        address?: string,
        indicator?: PageIndicator,
    ) => Promise<Pageable<FollowingSnapshotActivity, PageIndicator>>,
) {
    return async function fetchActivities(
        source: ActivitiesItem['source'],
        pageParam?: string,
        platform?: ActivitiesPlatform,
        connectedAddress?: string,
    ) {
        switch (source) {
            case Source.Article: {
                if (platform && platform === ActivitiesPlatform.Snapshot) {
                    return createPageable([], createIndicator(undefined, pageParam));
                }

                const result = await fetchArticles(
                    createIndicator(undefined, pageParam),
                    platform ? resolveArticlePlatform(platform) : undefined,
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
                if (platform && platform !== ActivitiesPlatform.Snapshot) {
                    return createPageable([], createIndicator(undefined, pageParam));
                }

                const result = await fetchSnapshots(connectedAddress, createIndicator(undefined, pageParam));
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
    (indicator, platform) => FireflyArticleProvider.getFollowingArticles(indicator, platform),
    (address, indicator) => FireflySocialMediaProvider.getFollowingSnapshotActivity({ address, indicator }),
);

export const getForYouActivities = createActivitiesFetcher(
    (indicator, platform) => FireflyArticleProvider.discoverArticles(indicator, platform ? [platform] : undefined),
    (address, indicator) => FireflySocialMediaProvider.discoverSnapshotActivity(address, indicator),
);

export function getProfileActivities(
    source: ActivitiesItem['source'],
    addresses: string[],
    pageParam?: string,
    platform?: ActivitiesPlatform,
    connectedAddress?: string,
) {
    return createActivitiesFetcher(
        (indicator, platform) => FireflyArticleProvider.discoverArticlesByAddress(addresses, indicator, platform),
        (address, indicator) =>
            FireflySocialMediaProvider.getFollowingSnapshotActivity({
                address,
                indicator,
                walletAddresses: addresses,
            }),
    )(source, pageParam, platform, connectedAddress);
}
