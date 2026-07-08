import type { LayoutProps } from '@dimensiondev/types';

import { Advertisement } from '@/components/Advertisement/index.js';
import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { SportRecommendationsSidebarLoader } from '@/components/Prediction/Sport/SportRecommendationsSidebarLoader.js';
import { Section } from '@/components/Semantic/Section.js';

// Parallel slot of /polymarket/event/[id]. The sibling main page reads `searchParams`,
// so the whole route is fully dynamic and this slot renders in the same per-request pass.
// Do NOT add `revalidate` (ISR) here: it conflicts with the dynamic render and bails out
// with DYNAMIC_SERVER_USAGE on every request, and buys no caching. Same fix as the main
// page in #9388.
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
