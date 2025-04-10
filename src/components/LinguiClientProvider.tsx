'use client';

import { I18nProvider } from '@lingui/react';
import { type PropsWithChildren,useEffect } from 'react';

import { bom } from '@/helpers/bom.js';
import { getLocaleFromCookiesAsync, useLocale } from '@/helpers/getCookie.js';
import { getI18nInstance, setLocale } from '@/i18n/index.js';

type LinguiClientProviderProps = PropsWithChildren<{}>;

export function LinguiClientProvider({ children }: LinguiClientProviderProps) {
    if (bom.document) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const locale = useLocale();

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            console.info('[i18n] set locale =', locale);
            setLocale(locale);
        }, [locale]);

        return <I18nProvider i18n={getI18nInstance(locale) as any}>{children}</I18nProvider>;
    } else {
        const locale = getLocaleFromCookiesAsync();
        return locale.then((locale) => <I18nProvider i18n={getI18nInstance(locale) as any}>{children}</I18nProvider>);
    }
}
