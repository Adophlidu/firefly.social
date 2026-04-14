import type { LayoutProps, SearchProps } from '@dimensiondev/types';

import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { PredictionPlatform } from '@/constants/enum.js';

export const revalidate = 60;

type Props = LayoutProps<{ id: string }> & SearchProps<{ type: 'multi' | string }>;

export default async function PolymarketEventPage(props: Props) {
    const { id } = await props.params;
    const { type } = await props.searchParams;

    return <PredictionEventDetailContent id={id} isMutil={type === 'multi'} platform={PredictionPlatform.Polymarket} />;
}
