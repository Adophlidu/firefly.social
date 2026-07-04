import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps, SearchProps } from '@dimensiondev/types';

import { getPolymarketEventPageData } from '@/app/[locale]/(normal)/polymarket/event/[id]/getPolymarketEventPageData.js';
import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';

export const revalidate = 60;

type Props = LayoutProps<{ id: string; locale: string }> & SearchProps<{ type: 'multi' | string }>;

export default async function PolymarketEventPage(props: Props) {
    const { id, locale } = await props.params;
    const { type } = await props.searchParams;
    const isMutil = type === 'multi';
    const { event } = await getPolymarketEventPageData(id, isMutil, locale);

    if (!event) notFound();

    return (
        <PredictionEventDetailContent
            event={event}
            id={id}
            isMutil={isMutil}
            locale={locale}
            platform={PredictionPlatform.Polymarket}
        />
    );
}
