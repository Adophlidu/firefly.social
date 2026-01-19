import { PredictionEventDetailContent } from '@/components/Prediction/PredictionEventDetailContent.js';
import { PredictionPlatform } from '@/constants/enum.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<
        {
            id: string;
        },
        {
            type: 'multi' | string;
        }
    > {}

export default async function OpinionEventPage(props: Props) {
    const { id } = await props.params;
    const { type } = await props.searchParams;

    return <PredictionEventDetailContent id={id} isMutil={type === 'multi'} platform={PredictionPlatform.Opinion} />;
}
