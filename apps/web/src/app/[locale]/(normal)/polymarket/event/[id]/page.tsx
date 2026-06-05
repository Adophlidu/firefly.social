import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps, SearchProps } from '@dimensiondev/types';
import { Suspense } from 'react';

import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { SportEventDetailSkeleton } from '@/components/Prediction/Sport/SportEventDetailSkeleton.js';

export const revalidate = 60;

type Props = LayoutProps<{ id: string }> & SearchProps<{ type: 'multi' | string }>;

export default async function PolymarketEventPage(props: Props) {
    const { id } = await props.params;
    const { type } = await props.searchParams;

    return (
        <Suspense fallback={<SportEventDetailSkeleton />}>
            <PredictionEventDetailContent id={id} isMutil={type === 'multi'} platform={PredictionPlatform.Polymarket} />
        </Suspense>
    );
}
