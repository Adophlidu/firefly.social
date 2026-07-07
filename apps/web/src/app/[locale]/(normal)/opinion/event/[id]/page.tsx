import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps, SearchProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { getPredictionEventPageMetadata } from '@/providers/firefly/metadata/getPredictionEventPageMetadata.js';

export const revalidate = 60;

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

    return (
        <PredictionEventDetailContent
            id={id}
            isMutil={type === 'multi'}
            locale={locale}
            platform={PredictionPlatform.Opinion}
        />
    );
}
