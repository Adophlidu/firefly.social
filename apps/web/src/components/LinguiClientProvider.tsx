'use client';

import { bom } from '@dimensiondev/utils';
import { I18nProvider } from '@lingui/react';
import { isServer } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { Locale, SiteCookies } from '@/constants/enum.js';
import { getI18nInstance, setupAndActiveI18n } from '@/i18n/core.js';

type LinguiClientProviderProps = PropsWithChildren<{ locale?: string }>;

function getLocaleFromClientCookie(): Locale {
    const pair = bom.document?.cookie.split('; ').find((x) => x.startsWith(`${SiteCookies.Locale}=`));
    if (!pair) return Locale.en;
    const value = pair.split('=')[1];
    return Object.values(Locale).includes(value as Locale) ? (value as Locale) : Locale.en;
}

function resolveLocale(locale?: string): Locale {
    if (locale && Object.values(Locale).includes(locale as Locale)) return locale as Locale;
    return Locale.en;
}

export function LinguiClientProvider({ locale, children }: LinguiClientProviderProps) {
    if (isServer) {
        // Use locale from props (passed from [locale]/layout.tsx) for SSR consistency
        const resolved = resolveLocale(locale);
        const i18n = getI18nInstance(resolved);
        i18n.activate(resolved);
        return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
    }

    const clientLocale = getLocaleFromClientCookie();
    setupAndActiveI18n(clientLocale);
    return <I18nProvider i18n={getI18nInstance(clientLocale)}>{children}</I18nProvider>;
}
