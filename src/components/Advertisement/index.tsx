import urlcat from 'urlcat';

import { AdvertisementSkeleton } from '@/components/Advertisement/AdvertisementSkeleton.js';
import { FIREFLY_S3_URL } from '@/constants/static.js';
import { dynamic } from '@/esm/dynamic.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { logger } from '@/libs/Logger.js';
import type { Advertisement } from '@/types/advertisement.js';

const AdvertisementSwiper = dynamic(
    () => import('@/components/Advertisement/AdvertisementSwiper.js').then((m) => m.AdvertisementSwiper),
    {
        ssr: false,
        loading: () => <AdvertisementSkeleton />,
    },
);

export async function Advertisement() {
    try {
        const response = await fetchJson<{ advertisements: Advertisement[] }>(
            urlcat(FIREFLY_S3_URL, '/advertisement/web.json'),
            {
                next: {
                    // 12 hours
                    revalidate: 60 * 60 * 12,
                },
            },
            {
                forceStaticMedia: true,
            },
        );
        const ads = response?.advertisements?.sort((a, b) => a.sort - b.sort);
        if (!ads?.length) return null;
        return <AdvertisementSwiper items={ads} />;
    } catch (error) {
        logger.error(`Failed to fetch advertisement: ${error}`);
        return null;
    }
}
