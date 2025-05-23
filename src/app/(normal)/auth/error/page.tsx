import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { Source } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(msg`Something went wrong`),
    });
}

export default async function Page() {
    await setupLocaleForSSR();
    return (
        <div className="flex w-full flex-col items-center">
            <div className="sticky top-[54px] z-20 flex w-full flex-col bg-primaryBottom md:top-0">
                <TimelineTitle title={<Trans>Something went wrong</Trans>} />
            </div>
            <NavigatorBar />
            <NotLoginFallback source={Source.Twitter} className="!pt-[100px]" />
        </div>
    );
}
