'use client';

import { getEnumAsArray } from '@masknet/kit';
import { redirect } from 'next/navigation.js';
import { useAsync } from 'react-use';

import { changeCookies } from '@/actions/changeCookies.js';
import FireflyIcon from '@/assets/logo.svg';
import { Agent, PageRoute } from '@/constants/enum.js';
import { useSearchParams } from '@/esm/navigation.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';

const action = async () => {
    const agent = fireflyBridgeProvider.supported ? Agent.FireflyApp : Agent.Browser;
    const formData = new FormData();
    formData.append('agent', agent);
    await changeCookies(formData);
};

export default function AgentPage() {
    const searchParams = useSearchParams();

    useAsync(async () => {
        await action();

        const url = searchParams.get('url') ?? PageRoute.Home;
        const isValidPageRoute = url && getEnumAsArray(PageRoute).some(({ value }) => value === url);

        try {
            redirect(isValidPageRoute ? url : PageRoute.Home);
        } catch (error) {
            console.error('Redirect error:', error);
            // Ignore the error and continue
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 z-10 flex h-screen items-center justify-center">
            <FireflyIcon className="h-24 w-24 animate-pulse" />
        </div>
    );
}
