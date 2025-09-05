'use client';

import { useQuery } from '@tanstack/react-query';

import { changeCookies } from '@/actions/changeCookies.js';
import { Locale } from '@/constants/enum.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

export function useFireflyBridgeLanguage() {
    return useQuery({
        enabled: fireflyBridgeProvider.supported,
        queryKey: ['firefly-bridge-language'],
        async queryFn() {
            const language = await fireflyBridgeProvider.request(SupportedMethod.GET_LANGUAGE, {});
            const data = new FormData();
            switch (language) {
                case 'zh':
                    data.append('locale', Locale.zhHans);
                    break;
                default:
                    data.append('locale', Locale.en);
                    break;
            }
            await changeCookies(data);
        },
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
    });
}
