'use client';

import { useLingui } from '@lingui/react';
import { useQuery } from '@tanstack/react-query';

import { Locale } from '@/constants/enum.js';
import { resolveLocale } from '@/helpers/getCookies.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

function resolveValidLocale(locale: string) {
    switch (locale.toLowerCase()) {
        case 'zh':
            return Locale.zhHans;
        case 'zh_cn':
            return Locale.zhHans;
        case 'zh_tw':
            return Locale.zhHant;
        default:
            return resolveLocale(locale);
    }
}

export function useFireflyBridgeLanguage() {
    const { i18n } = useLingui();
    return useQuery({
        enabled: fireflyBridgeProvider.supported,
        queryKey: ['firefly-bridge-language'],
        async queryFn() {
            const language = await fireflyBridgeProvider.request(SupportedMethod.GET_LANGUAGE, {});
            const locale = resolveValidLocale(language);
            if (i18n.locale === locale) return;
            i18n.activate(locale);
        },
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
    });
}
