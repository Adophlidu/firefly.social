import type { LayoutProps, SearchProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { createPredictionEventMetadata } from '@/providers/firefly/metadata/createPredictionEventMetadata.js';

export const revalidate = 60;

type Props = LayoutProps<{
    id: string;
}> &
    SearchProps<{
        type: 'multi' | string;
    }>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const [{ id }, { type }] = await Promise.all([props.params, props.searchParams]);

    return createPredictionEventMetadata(
        id,
        PredictionPlatform.Opinion,
        `/opinion/event/${id}${type ? `?type=${type}` : ''}`,
        type,
    );
}

export default async function OpinionEventPage(props: Props) {
    const [{ id }, { type }] = await Promise.all([props.params, props.searchParams]);

    return <PredictionEventDetailContent id={id} isMutil={type === 'multi'} platform={PredictionPlatform.Opinion} />;
}
