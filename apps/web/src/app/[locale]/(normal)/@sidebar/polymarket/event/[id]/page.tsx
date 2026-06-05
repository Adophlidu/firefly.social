import type { LayoutProps } from '@dimensiondev/types';
import { Suspense } from 'react';

import { AdvertisementSkeleton } from '@/components/Advertisement/AdvertisementSkeleton.js';
import { Advertisement } from '@/components/Advertisement/index.js';
import { SportRecommendationsSidebarLoader } from '@/components/Prediction/Sport/SportRecommendationsSidebarLoader.js';
import { Section } from '@/components/Semantic/Section.js';

export const revalidate = 60;

type Props = LayoutProps<{ id: string }>;

export default async function PolymarketEventSidebarPage(props: Props) {
    const { id } = await props.params;

    return (
        <>
            <Section title="Advertisement" className="mt-[26px]">
                <Suspense fallback={<AdvertisementSkeleton />}>
                    <Advertisement />
                </Suspense>
            </Section>
            <SportRecommendationsSidebarLoader id={id} />
        </>
    );
}
