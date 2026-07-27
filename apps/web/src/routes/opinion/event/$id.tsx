import { PredictionPlatform } from '@dimensiondev/enums';
import { type HeadContext, type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { resolveRequestLocale } from '@/helpers/resolveRequestLocale.js';
import { resolveLocale } from '@/helpers/resolveLocale.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { getPredictionEventPageMetadata } from '@/providers/firefly/metadata/getPredictionEventPageMetadata.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';
import { runInSafeAsync } from '@dimensiondev/utils';

interface OpinionEventLoaderData {
    id: string;
    isMutil: boolean;
    locale: string;
    type: string | null;
    event: BetsEventDataForUI;
}

// Reads ?type= searchParams — fully dynamic by design (no cache config).
export async function loader({ params, url, request }: LoaderContext): Promise<OpinionEventLoaderData> {
    const id = params.id!;
    const type = url.searchParams.get('type');
    const isMutil = type === 'multi';
    const locale = resolveRequestLocale(request);

    const event = await runInSafeAsync(() =>
        getEventDetail(PredictionPlatform.Opinion, { id, isMutil, locale: resolveLocale(locale) }),
    );
    if (!event) notFound();

    return { id, isMutil, locale, type, event };
}

export async function head({ data, params }: HeadContext) {
    const { isMutil, locale, type } = (data ?? {}) as Partial<OpinionEventLoaderData>;
    return fromNextMetadata(
        await getPredictionEventPageMetadata({
            id: params.id ?? '',
            isMutil: Boolean(isMutil),
            locale: locale ?? 'en',
            platform: PredictionPlatform.Opinion,
            pathname: `/opinion/event/${params.id}${type ? `?type=${type}` : ''}`,
            type: type ?? undefined,
        }),
    );
}

export default function OpinionEventPage() {
    const { event, id, isMutil, locale } = useLoaderData<OpinionEventLoaderData>('opinion/event/$id.tsx');
    return (
        <PredictionEventDetailContent
            event={event}
            id={id}
            isMutil={isMutil}
            locale={locale}
            platform={PredictionPlatform.Opinion}
        />
    );
}
