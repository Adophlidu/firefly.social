import type { LayoutProps } from '@dimensiondev/types';

import { Advertisement } from '@/components/Advertisement/index.js';
import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { SportRecommendationsSidebarLoader } from '@/components/Prediction/Sport/SportRecommendationsSidebarLoader.js';
import { Section } from '@/components/Semantic/Section.js';

export const revalidate = 60;

type Props = LayoutProps<{ id: string }>;

export default async function PolymarketEventSidebarPage(props: Props) {
    const { id } = await props.params;

    return (
        <SportRecommendationsSidebarLoader
            id={id}
            advertisement={
                <Section title="Advertisement" className="mt-[26px]">
                    <Advertisement />
                </Section>
            }
            fallback={<DefaultRightSidebarContent />}
        />
    );
}
