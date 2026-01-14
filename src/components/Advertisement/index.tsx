import { AdvertisementItem } from '@/components/Advertisement/AdvertisementItem.js';
import { AdvertisementSkeleton } from '@/components/Advertisement/AdvertisementSkeleton.js';
import { AdvertisementType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { dynamic } from '@/esm/dynamic.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { logger } from '@/libs/Logger.js';
import { getFireflyActivityList } from '@/providers/firefly/activity/getFireflyActivityList.js';
import { ActivityStatus } from '@/providers/types/Firefly.js';
import { type Advertisement as AdvertisementInterface } from '@/types/advertisement.js';

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

    return [...STATIC_ADS, ...activityBannerAds];
}

export async function Advertisement() {
    try {
        const ads = await fetchAdvertisements();

        if (!ads.length) return null;
        if (ads.length === 1)
            return (
                <div className="ff-advertisement">
                    <AdvertisementItem ad={ads[0]} />
                </div>
            );

        return <AdvertisementSwiper items={ads} />;
    } catch (error) {
        logger.error(`Failed to fetch advertisement: ${error}`);
        return null;
    }
}
