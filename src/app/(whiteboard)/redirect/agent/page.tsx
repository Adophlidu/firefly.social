'use client';

import { getEnumAsArray } from '@masknet/kit';
import { redirect } from 'next/navigation.js';
import { useAsync } from 'react-use';
import urlcat from 'urlcat';

import FireflyIcon from '@/assets/logo.svg';
import { Agent, PageRoute } from '@/constants/enum.js';
import { useSearchParams } from '@/esm/navigation.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';

const action = async () => {
    const agent = fireflyBridgeProvider.supported ? Agent.FireflyApp : Agent.Browser;
    await fetchJSON(
        urlcat('/api/settings/agent', {
            agent,
        }),
        {
            method: 'POST',
        },
    );
};

export default function AgentPage() {
    const searchParams = useSearchParams();

    useAsync(async () => {
        await runInSafeAsync(async () => action());

        const url = searchParams.get('url') ?? PageRoute.Home;
        const isValidPageRoute = url && getEnumAsArray(PageRoute).some(({ value }) => value === url);
        redirect(isValidPageRoute ? url : PageRoute.Home);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 z-10 flex h-screen items-center justify-center">
            <FireflyIcon className="h-24 w-24 animate-pulse" />
        </div>
    );
}
