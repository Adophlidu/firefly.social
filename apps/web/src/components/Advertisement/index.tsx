import { EMPTY_LIST } from '@dimensiondev/constants';
import { ActivityStatus, AdvertisementType } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { headers } from 'next/headers.js';

import { AdvertisementItem } from '@/components/Advertisement/AdvertisementItem.js';
import { AdvertisementSkeleton } from '@/components/Advertisement/AdvertisementSkeleton.js';
import { dynamic } from '@/esm/dynamic.js';
import { logger } from '@/libs/Logger.js';
import { getFireflyActivityList } from '@/providers/firefly/activity/getFireflyActivityList.js';
import type { Advertisement as AdvertisementInterface } from '@/types/advertisement.js';

const AdvertisementSwiper = dynamic(
    () => import('@/components/Advertisement/AdvertisementSwiper.js').then((m) => m.AdvertisementSwiper),
    {
        ssr: false,
        loading: () => <AdvertisementSkeleton />,
    },
);

const STATIC_ADS: AdvertisementInterface[] = [
    {
        sort: 0,
        image: 'https://media.firefly.land/advertisement/download.png',
        link: 'https://about.firefly.social/',
        type: AdvertisementType.Link,
    },
];

async function fetchAdvertisements(): Promise<AdvertisementInterface[]> {
    const activities = await runInSafeAsync(() => getFireflyActivityList({ size: 20 }));
    const activityBannerAds: AdvertisementInterface[] = (activities?.data || EMPTY_LIST)
        .filter((activity) => activity.status !== ActivityStatus.Ended && !!activity.web_banner_url)
        .map((activity, index) => ({
            type: AdvertisementType.Link,
            image: activity.web_banner_url!,
            link: activity.url,
            sort: index + 100,
        }));

    return [...activityBannerAds, ...STATIC_ADS];
}

export async function Advertisement() {
    try {
        const ads = await fetchAdvertisements();
        const requestUrl = await headers().then((h) => h.get('X-URL'));
        const origin = requestUrl ? new URL(requestUrl).origin : '';

        if (!ads.length) return null;
        if (ads.length === 1)
            return (
                <div className="ff-advertisement">
                    <AdvertisementItem ad={ads[0]} origin={origin} />
                </div>
            );

        return <AdvertisementSwiper items={ads} origin={origin} />;
    } catch (error) {
        logger.error(`Failed to fetch advertisement: ${error}`);
        return null;
    }
}
