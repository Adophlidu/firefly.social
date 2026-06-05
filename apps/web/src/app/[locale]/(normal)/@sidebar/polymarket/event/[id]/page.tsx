import type { LayoutProps } from '@dimensiondev/types';

import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { SportRecommendationsSidebarLoader } from '@/components/Prediction/Sport/SportRecommendationsSidebarLoader.js';

export const revalidate = 60;

type Props = LayoutProps<{ id: string }>;

export default async function PolymarketEventSidebarPage(props: Props) {
    const { id } = await props.params;

    return <SportRecommendationsSidebarLoader id={id} fallback={<DefaultRightSidebarContent />} />;
}
