import type { LayoutProps } from '@dimensiondev/types';

import { Advertisement } from '@/components/Advertisement/index.js';
import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { SportRecommendationsSidebarLoader } from '@/components/Prediction/Sport/SportRecommendationsSidebarLoader.js';
import { Section } from '@/components/Semantic/Section.js';

export const revalidate = 60;

// Static-class stub: with no build-time params, every path is rendered on demand
// and cached per `revalidate` (routes without generateStaticParams are forced dynamic).
export function generateStaticParams() {
    return [];
}

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
