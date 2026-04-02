'use client';

import { Trans } from '@lingui/react/macro';
import { useSearchParams } from 'next/navigation.js';

import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { Source } from '@/constants/enum.js';

export default function Page() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error') || '';

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
