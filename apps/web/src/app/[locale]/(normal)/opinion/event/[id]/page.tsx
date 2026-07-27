import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps, SearchProps } from '@dimensiondev/types';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';

import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';
import { resolveLocale } from '@/helpers/resolveLocale.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { getPredictionEventPageMetadata } from '@/providers/firefly/metadata/getPredictionEventPageMetadata.js';

// Reads ?type= searchParams, so this route is fully dynamic. Do NOT add `revalidate`:
// it makes Next attempt ISR prerenders that bail out with DYNAMIC_SERVER_USAGE on every
// request (the page renders dynamically regardless, so it buys no caching).
type Props = LayoutProps<{
    id: string;
    locale: string;
}> &
    SearchProps<{
        type: 'multi' | string;
    }>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const [{ id, locale }, { type }] = await Promise.all([props.params, props.searchParams]);

    return getPredictionEventPageMetadata({
        id,
        isMutil: type === 'multi',
        locale,
        platform: PredictionPlatform.Opinion,
        pathname: `/opinion/event/${id}${type ? `?type=${type}` : ''}`,
        type,
    });
}

export default async function OpinionEventPage(props: Props) {
    const [{ id, locale }, { type }] = await Promise.all([props.params, props.searchParams]);
    const isMutil = type === 'multi';
    const event = await runInSafeAsync(() =>
        getEventDetail(PredictionPlatform.Opinion, { id, isMutil, locale: resolveLocale(locale) }),
    );

    if (!event) notFound();

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
