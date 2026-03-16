import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { type LoginFallbackSource, Source } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { type LayoutProps } from '@/types/utility.js';

function getSourceFromError(error: string): LoginFallbackSource {
    return Source.Twitter;
}

interface Props extends LayoutProps<never, { error: string }> {}

export async function generateMetadata() {
    return createSiteMetadata('/auth/error', {
        title: await createPageTitleSSR(msg`Something went wrong`),
    });
}

export default async function Page(props: Props) {
    await setupLocaleForSSR();
    const params = await props.searchParams;

    return (
        <div className="flex w-full flex-col items-center">
            <div className="sticky top-[54px] z-20 flex w-full flex-col bg-primaryBottom md:top-0">
                <TimelineTitle title={<Trans>Something went wrong</Trans>} />
            </div>
            <NavigatorBar />
            <NotLoginFallback source={getSourceFromError(params.error)} className="!pt-[100px]" />
        </div>
    );
}
