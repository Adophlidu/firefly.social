'use client';

import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { memo, type ReactNode } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { ToggleEnableButton } from '@/components/TrumpTruthSocial/ToggleEnableButton.js';
import { ExploreType } from '@/constants/enum.js';
import { useSelectedLayoutSegments } from '@/esm/navigation.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { POLYMARKET_FIREFLY_SLUG } from '@/providers/prediction/polymarket/constants.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface ExploreSourceTabsProps {
    exploreTypes: Array<{ type: ExploreType; id: string; link?: string; label?: string }>;
    explore: ExploreType;
}

export const ExploreSourceTabs = memo<ExploreSourceTabsProps>(function ExploreSourceTabs({ exploreTypes, explore }) {
    const segments = useSelectedLayoutSegments();

    const labels: Record<ExploreType, ReactNode> = {
        [ExploreType.TopProfiles]: <Trans>Users</Trans>,
        [ExploreType.Projects]: <Trans>Projects</Trans>,
        [ExploreType.CryptoTrends]: <Trans>Tokens</Trans>,
        [ExploreType.TopChannels]: <Trans>Clubs</Trans>,
        [ExploreType.TruthSocial]: <Trans>Truth Social</Trans>,
        [ExploreType.NFTs]: <Trans>NFTs</Trans>,
        [ExploreType.Bets]: <Trans>Predictions</Trans>,
    };
    const hasFireflySlug = exploreTypes.some((x) => x.id === POLYMARKET_FIREFLY_SLUG);

    return (
        <SourceTabs className="!z-20 md:!top-[57px]">
            {exploreTypes.map(({ type: x, id, link, label }) => {
                const isActive =
                    x === explore && x === ExploreType.Bets
                        ? id === POLYMARKET_FIREFLY_SLUG
                            ? first(segments) === POLYMARKET_FIREFLY_SLUG
                            : !hasFireflySlug || first(segments) !== POLYMARKET_FIREFLY_SLUG
                        : x === explore;
                const href = link || resolveExploreUrl(x);

                return x === ExploreType.TruthSocial ? (
                    <NoSSR key={x}>
                        <ToggleEnableButton
                            isActive={isActive}
                            link={resolveExploreUrl(ExploreType.TruthSocial)}
                            replaceUrl={resolveExploreUrl(ExploreType.TopProfiles)}
                        />
                    </NoSSR>
                ) : (
                    <SourceTab
                        className="whitespace-nowrap !px-2 text-base md:!h-[45px] md:!px-4 md:!py-2.5"
                        key={id}
                        href={href}
                        isActive={isActive}
                        telemetryEventId={x === ExploreType.Bets ? EventId.EVENT_EXPLORE_PREDICTIONS_CLICK : undefined}
                    >
                        {label || labels[x]}
                    </SourceTab>
                );
            })}
        </SourceTabs>
    );
});
