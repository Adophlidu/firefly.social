'use client';

import { ExploreType } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { memo, type ReactNode } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { ToggleEnableButton } from '@/components/TrumpTruthSocial/ToggleEnableButton.js';
import { useSelectedLayoutSegments } from '@/esm/navigation.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { useExploreTabs } from '@/hooks/useExploreTabs.js';
import { POLYMARKET_FIREFLY_SLUG } from '@/providers/prediction/polymarket/constants.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface ExploreSourceTabsProps {
    explore: ExploreType;
}

export const ExploreSourceTabs = memo<ExploreSourceTabsProps>(function ExploreSourceTabs({ explore }) {
    const segments = useSelectedLayoutSegments();
    const exploreTypes = useExploreTabs();

    const labels: Record<ExploreType, ReactNode> = {
        [ExploreType.TopProfiles]: <Trans>Users</Trans>,
        [ExploreType.Projects]: <Trans>Projects</Trans>,
        [ExploreType.CryptoTrends]: <Trans>Tokens</Trans>,
        [ExploreType.TopChannels]: <Trans>Clubs</Trans>,
        [ExploreType.TruthSocial]: <Trans>Truth Social</Trans>,
        [ExploreType.Prediction]: <Trans>Predictions</Trans>,
    };
    const hasFireflySlug = exploreTypes.some((x) => x.id === POLYMARKET_FIREFLY_SLUG);

    return (
        <SourceTabs className="!static !z-auto">
            {exploreTypes.map(({ type: x, id, link, label }) => {
                const isActive =
                    x === explore && x === ExploreType.Prediction
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
                        telemetryEventId={
                            x === ExploreType.Prediction ? EventId.EVENT_EXPLORE_PREDICTIONS_CLICK : undefined
                        }
                    >
                        {label || labels[x]}
                    </SourceTab>
                );
            })}
        </SourceTabs>
    );
});
