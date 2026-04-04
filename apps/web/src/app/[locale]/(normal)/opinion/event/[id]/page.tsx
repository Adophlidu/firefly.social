import { type Metadata } from 'next';

import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { createPredictionEventMetadata } from '@/providers/firefly/metadata/createPredictionEventMetadata.js';
import { type LayoutProps } from '@/types/utility.js';

export const revalidate = 60;

interface Props
    extends LayoutProps<
        {
            id: string;
        },
        {
            type: 'multi' | string;
        }
    > {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
    const { type } = await props.searchParams;

    return createPredictionEventMetadata(
        id,
        PredictionPlatform.Opinion,
        `/opinion/event/${id}${type ? `?type=${type}` : ''}`,
        type,
    );
}

export default async function OpinionEventPage(props: Props) {
    const { id } = await props.params;
    const { type } = await props.searchParams;

    return <PredictionEventDetailContent id={id} isMutil={type === 'multi'} platform={PredictionPlatform.Opinion} />;
}
