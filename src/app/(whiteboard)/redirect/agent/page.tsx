'use client';

import { delay, getEnumAsArray } from '@masknet/kit';
import { redirect } from 'next/navigation.js';
import { useAsync } from 'react-use';

import { changeCookies } from '@/actions/changeCookies.js';
import FireflyIcon from '@/assets/logo.svg';
import { Agent, Locale, PageRoute } from '@/constants/enum.js';
import { useSearchParams } from '@/esm/navigation.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

const action = async () => {
    const agent = fireflyBridgeProvider.supported ? Agent.FireflyApp : Agent.Browser;

    const formData = new FormData();
    formData.append('agent', agent);

    if (agent === Agent.FireflyApp) {
        const language = await fireflyBridgeProvider.request(SupportedMethod.GET_LANGUAGE, {});
        formData.append('locale', resolveLocale(language as 'en' | 'zh'));
    }

    await delay(1000);
    await changeCookies(formData);
};

const resolveLocale = createLookupTableResolver<'en' | 'zh', Locale>(
    {
        en: Locale.en,
        zh: Locale.zhHans,
    },
    Locale.en,
);

export default function AgentPage() {
    const searchParams = useSearchParams();

    useAsync(async () => {
        await action();

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
