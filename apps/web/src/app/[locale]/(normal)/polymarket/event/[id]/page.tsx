import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps, SearchProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import {
    getPolymarketEventPageData,
    getPolymarketEventPageMetadata,
} from '@/app/[locale]/(normal)/polymarket/event/[id]/getPolymarketEventPageData.js';
import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';

export const revalidate = 60;

type Props = LayoutProps<{ id: string; locale: string }> & SearchProps<{ type: 'multi' | string }>;

// generateMetadata must live on the page: Next.js never passes searchParams to layouts.
export async function generateMetadata(props: Props): Promise<Metadata> {
    const [{ id, locale }, { type }] = await Promise.all([props.params, props.searchParams]);
    const isMutil = type === 'multi';

    return getPolymarketEventPageMetadata({
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
