import { PageRoute } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';

import { DefaultRightSidebar } from '@/components/DefaultRightSidebar.js';
import { Link } from '@/components/Link.js';
import { Image } from '@/esm/Image.js';

export function NotFoundView() {
    return (
        <>
            <main className="flex min-h-screen w-full flex-[1_1_100%] flex-col md:border-r md:border-line md:pl-[235px] lg:w-[888px] lg:max-w-[calc(100%-384px)] lg:pl-[289px]">
                <div className="flex grow flex-col items-center justify-center">
                    <Image src="/image/radar.png" width={200} height={106} alt="Page not found" />
                    <div className="mt-11 text-sm font-bold">
                        <Trans>The page could not be found.</Trans>
                    </div>
                    <Link className="text-link underline md:hidden" href={PageRoute.Home}>
                        <Trans>Back to home</Trans>
                    </Link>
                </div>
            </main>
            <DefaultRightSidebar />
        </>
    );
}
