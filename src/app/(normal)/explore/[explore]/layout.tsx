import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { PredictionSourceNav } from '@/components/SourceNav/PredictionSourceNav.js';
import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { ToggleEnableButton } from '@/components/TrumpTruthSocial/ToggleEnableButton.js';
import { queryClientConfig } from '@/configs/queryClient.js';
import { EXPLORE_TYPES } from '@/constants/computed.js';
import { ExploreType } from '@/constants/enum.js';
import { NFT_ENABLED } from '@/constants/static.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { type NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ explore: ExploreType }> {}

export async function generateMetadata(props: Props) {
    const { explore } = await props.params;

    return createSiteMetadata(`/explore/${explore}`, {
        title: await createPageTitleSSR(msg`Explore`),
    });
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const { explore } = await props.params;

    const labels: Record<ExploreType, ReactNode> = {
        [ExploreType.TopProfiles]: <Trans>Users</Trans>,
        [ExploreType.Projects]: <Trans>Projects</Trans>,
        [ExploreType.CryptoTrends]: <Trans>Tokens</Trans>,
        [ExploreType.TopChannels]: <Trans>Clubs</Trans>,
        [ExploreType.TruthSocial]: <Trans>Truth Social</Trans>,
        [ExploreType.NFTs]: <Trans>NFTs</Trans>,
        [ExploreType.Bets]: <Trans>Predictions</Trans>,
    };

    const queryClient = new QueryClient(queryClientConfig);

    if (explore === ExploreType.Bets) {
        await queryClient.prefetchQuery({
            queryKey: ['bets', 'slugs-list'],
            queryFn: () => getEventSlugList(),
        });
    }

    return (
        <>
            <SourceTabs className="!z-20 md:!top-[57px]">
                {EXPLORE_TYPES.filter((x) => (NFT_ENABLED ? true : x !== ExploreType.NFTs)).map((x) =>
                    x === ExploreType.TruthSocial ? (
                        <NoSSR key={x}>
                            <ToggleEnableButton
                                isActive={x === explore}
                                link={resolveExploreUrl(ExploreType.TruthSocial)}
                                replaceUrl={resolveExploreUrl(ExploreType.TopProfiles)}
                            />
                        </NoSSR>
                    ) : (
                        <SourceTab
                            className="whitespace-nowrap !px-2 text-base md:!h-[45px] md:!px-4 md:!py-2.5"
                            key={x}
                            href={resolveExploreUrl(x)}
                            isActive={x === explore}
                            telemetryEventId={
                                x === ExploreType.Bets ? EventId.EVENT_EXPLORE_PREDICTIONS_CLICK : undefined
                            }
                        >
                            {labels[x]}
                        </SourceTab>
                    ),
                )}
            </SourceTabs>
            {explore === ExploreType.Bets ? (
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <PredictionSourceNav className="sticky top-[98px] z-20 bg-primaryBottom md:!top-[103px]" />
                </HydrationBoundary>
            ) : null}
            {props.children}
        </>
    );
}
