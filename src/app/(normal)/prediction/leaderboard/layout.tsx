import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { Comeback } from '@/components/Comeback.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { type LayoutProps } from '@/types/utility.js';

export async function generateMetadata() {
    return createSiteMetadata(`/prediction/leaderboard`, {
        title: await createPageTitleSSR(msg`Prediction Leaderboard`),
    });
}

export default async function BetsLeaderboardLayout(props: LayoutProps) {
    await setupLocaleForSSR();

    return (
        <div>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-black text-lightMain">
                        <Trans>Leaderboard</Trans>
                    </span>
                </div>
            </div>
            <div className="flex grow flex-col">{props.children}</div>
        </div>
    );
}
