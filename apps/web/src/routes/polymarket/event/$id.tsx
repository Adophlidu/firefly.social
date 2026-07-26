import { PredictionPlatform } from '@dimensiondev/enums';
import { type HeadContext, type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { getPolymarketEventPageData } from '@/providers/firefly/metadata/getPolymarketEventPageData.js';
import { getPredictionEventPageMetadata } from '@/providers/firefly/metadata/getPredictionEventPageMetadata.js';

interface PolymarketEventLoaderData {
    event: NonNullable<Awaited<ReturnType<typeof getPolymarketEventPageData>>['event']>;
    id: string;
    isMutil: boolean;
    locale: string;
    type: string | null;
}

// Reads ?type= searchParams — fully dynamic by design (no cache config).
export async function loader({ params, url }: LoaderContext): Promise<PolymarketEventLoaderData> {
    const id = params.id!;
    const locale = params.locale!;
    const type = url.searchParams.get('type');
    const isMutil = type === 'multi';

    const { event } = await getPolymarketEventPageData(id, isMutil, locale);
    if (!event) notFound();

    return { event, id, isMutil, locale, type };
}

export async function head({ data, params }: HeadContext) {
    const { isMutil, locale, type } = (data ?? {}) as Partial<PolymarketEventLoaderData>;
    return fromNextMetadata(
        await getPredictionEventPageMetadata({
            id: params.id ?? '',
            isMutil: Boolean(isMutil),
            locale: locale ?? params.locale ?? 'en',
            platform: PredictionPlatform.Polymarket,
            pathname: `/polymarket/event/${params.id}`,
            type: type ?? undefined,
        }),
    );
}

export default function PolymarketEventPage() {
    const { event, id, isMutil, locale } = useLoaderData<PolymarketEventLoaderData>();
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
