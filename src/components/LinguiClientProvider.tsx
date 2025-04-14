'use client';

import { I18nProvider } from '@lingui/react';
import type { PropsWithChildren } from 'react';

import { bom } from '@/helpers/bom.js';
import { getLocaleFromCookies, getLocalFromClientCookies } from '@/helpers/getCookies.js';
import { getI18nInstance, setupLocalForClient } from '@/i18n/index.js';

type LinguiClientProviderProps = PropsWithChildren<{}>;

export function LinguiClientProvider({ children }: LinguiClientProviderProps) {
    if (bom.document) {
        setupLocalForClient();

         
        const locale = getLocalFromClientCookies();
        return <I18nProvider i18n={getI18nInstance(locale)}>{children}</I18nProvider>;
    } else {
        const locale = getLocaleFromCookies();
        return locale.then((locale) => <I18nProvider i18n={getI18nInstance(locale)}>{children}</I18nProvider>);
    }
}
