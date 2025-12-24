import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type ReactNode } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { ToggleEnableButton } from '@/components/TrumpTruthSocial/ToggleEnableButton.js';
import { EXPLORE_TYPES } from '@/constants/computed.js';
import { ExploreType } from '@/constants/enum.js';
import { NFT_ENABLED } from '@/constants/static.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/utility.js';

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
        [ExploreType.Bets]: <Trans>Bets</Trans>,
    };

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
                        >
                            {labels[x]}
                        </SourceTab>
                    ),
                )}
            </SourceTabs>
            {props.children}
        </>
    );
}
