'use client';

import { useLingui } from '@lingui/react';
import { useQuery } from '@tanstack/react-query';

import { Locale } from '@/constants/enum.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

export function useFireflyBridgeLanguage() {
    const { i18n } = useLingui();
    return useQuery({
        enabled: fireflyBridgeProvider.supported,
        queryKey: ['firefly-bridge-language'],
        async queryFn() {
            const language = await fireflyBridgeProvider.request(SupportedMethod.GET_LANGUAGE, {});
            switch (language) {
                case 'zh':
                    i18n.activate(Locale.zhHans);
                    break;
                default:
                    i18n.activate(language);
                    break;
            }
        },
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
    });
}
