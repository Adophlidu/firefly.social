'use client';

import { I18nProvider } from '@lingui/react';
import { type PropsWithChildren } from 'react';

import { bom } from '@/helpers/bom.js';
import { getLocaleFromCookiesAsync, useLocale } from '@/helpers/getCookie.js';
import { getI18nInstance } from '@/i18n/index.js';

type LinguiClientProviderProps = PropsWithChildren<{}>;

export function LinguiClientProvider({ children }: LinguiClientProviderProps) {
    if (bom.document) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const locale = useLocale();
        return <I18nProvider i18n={getI18nInstance(locale) as any}>{children}</I18nProvider>;
    } else {
        const locale = getLocaleFromCookiesAsync();
        return locale.then((locale) => <I18nProvider i18n={getI18nInstance(locale) as any}>{children}</I18nProvider>);
    }
}
