import { PredictionPlatform } from '@dimensiondev/enums';
import { type HeadContext, type LoaderContext, useLoaderData } from '@dimensiondev/ssr';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { getPredictionEventPageMetadata } from '@/providers/firefly/metadata/getPredictionEventPageMetadata.js';
import { resolveRequestLocale } from '@/helpers/resolveRequestLocale.js';

interface OpinionEventLoaderData {
    id: string;
    isMutil: boolean;
    locale: string;
    type: string | null;
}

// Reads ?type= searchParams — fully dynamic by design (no cache config).
export function loader({ params, url, request }: LoaderContext): OpinionEventLoaderData {
    const type = url.searchParams.get('type');
    return {
        id: params.id!,
        isMutil: type === 'multi',
        locale: resolveRequestLocale(request),
        type,
    };
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
    const { id, isMutil, locale } = useLoaderData<OpinionEventLoaderData>();
    return (
        <PredictionEventDetailContent
            id={id}
            isMutil={isMutil}
            locale={locale}
            platform={PredictionPlatform.Opinion}
        />
    );
}
