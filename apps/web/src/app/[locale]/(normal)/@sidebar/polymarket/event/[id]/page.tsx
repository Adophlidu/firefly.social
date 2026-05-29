import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { runInSafeAsync } from '@dimensiondev/utils';

import { Advertisement } from '@/components/Advertisement/index.js';
import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { SportRecommendationsSidebar } from '@/components/Prediction/Sport/SportRecommendationsSidebar.js';
import { Section } from '@/components/Semantic/Section.js';
import { formatPolymarketSportsEventForUI } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { getSportRecommendationsResult } from '@/providers/firefly/prediction/getSportRecommendations.js';

export const revalidate = 60;

type Props = LayoutProps<{ id: string }>;

export default async function PolymarketEventSidebarPage(props: Props) {
    const { id } = await props.params;
    const detail = await runInSafeAsync(() =>
        getEventDetail(PredictionPlatform.Polymarket, {
            id,
            isMutil: false,
        }),
    );
    const sportData = detail?.sportData;
    const leagueSlug = sportData?.leagueSlug;

    if (!sportData) return <DefaultRightSidebarContent />;

    const result = await runInSafeAsync(() => getSportRecommendationsResult(leagueSlug, sportData.gameId));
    const recommendations = (result?.events || [])
        .filter((event) => !!formatPolymarketSportsEventForUI(event))
        .slice(0, 5);

    if (!recommendations.length) return <DefaultRightSidebarContent />;

    return (
        <>
            <Section title="Advertisement" className="mt-[26px]">
                <Advertisement />
            </Section>
            <SportRecommendationsSidebar
                categorySlug={result?.categorySlug || leagueSlug || 'live'}
                categoryTagType={result?.categoryTagType}
                events={recommendations}
            />
        </>
    );
}
