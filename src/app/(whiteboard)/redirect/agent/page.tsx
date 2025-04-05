'use client';

import { delay } from '@masknet/kit';
import { useRouter, useSearchParams } from 'next/navigation.js';
import { useAsync } from 'react-use';

import { changeCookies } from '@/actions/changeCookies.js';
import FireflyIcon from '@/assets/logo.svg';
import { Agent, Locale, PageRoute } from '@/constants/enum.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { setLocale } from '@/i18n/index.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

const getAgentType = () => {
    if (fireflyBridgeProvider.supported) return Agent.FireflyApp;
    return Agent.Browser;
};

const resolveLocale = createLookupTableResolver<'en' | 'zh', Locale>(
    {
        en: Locale.en,
        zh: Locale.zhHans,
    },
    Locale.en,
);

export default function AgentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('url');

    useAsync(async () => {
        const agent = getAgentType();

        const formData = new FormData();
        formData.append('agent', agent);
        formData.append('url', returnUrl ?? PageRoute.Home);

        if (agent === Agent.FireflyApp) {
            const language = await fireflyBridgeProvider.request(SupportedMethod.GET_LANGUAGE, {});
            formData.append('locale', resolveLocale(language as 'en' | 'zh'));
        }

        if (formData.has('locale')) setLocale(formData.get('locale') as Locale);

        await delay(1000);
        await changeCookies(formData);
    }, [router, returnUrl]);

    return (
        <div className="fixed inset-0 z-10 flex h-screen items-center justify-center">
            <FireflyIcon className="h-24 w-24 animate-pulse" />
        </div>
    );
}
