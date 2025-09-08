import { AdvertisementSkeleton } from '@/components/Advertisement/AdvertisementSkeleton.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { ADVERTISEMENT_JSON_URL } from '@/constants/index.js';
import { dynamic } from '@/esm/dynamic.js';
import { fetchJson } from '@/helpers/fetchJson.js';
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
            ADVERTISEMENT_JSON_URL,
            env.external.NEXT_PUBLIC_BANNER_CACHE === STATUS.Enabled
                ? {
                      next: {
                          // 12 hours
                          revalidate: 60 * 60 * 12,
                      },
                  }
                : undefined,
        );
        const ads = response?.advertisements?.sort((a, b) => a.sort - b.sort);
        if (!ads?.length) return null;
        return <AdvertisementSwiper items={ads} />;
    } catch (error) {
        console.error(`Failed to fetch advertisement: ${error}`);
        return null;
    }
}
