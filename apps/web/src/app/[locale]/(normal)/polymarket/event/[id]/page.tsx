import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps, SearchProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';
import { getPolymarketEventPageData } from '@/providers/firefly/metadata/getPolymarketEventPageData.js';
import { getPredictionEventPageMetadata } from '@/providers/firefly/metadata/getPredictionEventPageMetadata.js';

// Reads ?type= searchParams, so this route is fully dynamic. Do NOT add `revalidate`:
// it makes Next attempt ISR prerenders that bail out with DYNAMIC_SERVER_USAGE on every
// request (the page renders dynamically regardless, so it buys no caching).
type Props = LayoutProps<{ id: string; locale: string }> & SearchProps<{ type: 'multi' | string }>;

// generateMetadata must live on the page: Next.js never passes searchParams to layouts.
export async function generateMetadata(props: Props): Promise<Metadata> {
    const [{ id, locale }, { type }] = await Promise.all([props.params, props.searchParams]);
    const isMutil = type === 'multi';

    return getPredictionEventPageMetadata({
        id,
        isMutil,
        locale,
        platform: PredictionPlatform.Polymarket,
        pathname: `/polymarket/event/${id}`,
        type,
    });
}

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
