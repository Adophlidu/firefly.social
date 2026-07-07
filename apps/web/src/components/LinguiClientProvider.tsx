'use client';

import { Locale, SiteCookies } from '@dimensiondev/enums';
import { bom } from '@dimensiondev/utils';
import type { I18n, Messages } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { isServer } from '@tanstack/react-query';
import { type PropsWithChildren, use } from 'react';

import { activateI18n, createI18nInstance } from '@/i18n/core.js';

type LinguiClientProviderProps = PropsWithChildren<{ locale?: string }>;

// Static specifiers keep each catalog in its own lazily-loaded chunk, so the
// client bundle ships only the active locale instead of all six (~30KB gzip each).
const catalogLoaders: Record<Locale, () => Promise<{ messages: Messages }>> = {
    [Locale.en]: () => import('@/locales/en/messages.js'),
    [Locale.es]: () => import('@/locales/es/messages.js'),
    [Locale.ja]: () => import('@/locales/ja/messages.js'),
    [Locale.ko]: () => import('@/locales/ko/messages.js'),
    [Locale.zhHans]: () => import('@/locales/zh-Hans/messages.js'),
    [Locale.zhHant]: () => import('@/locales/zh-Hant/messages.js'),
};

const i18nInstances = new Map<Locale, Promise<I18n>>();

function loadI18nInstance(locale: Locale): Promise<I18n> {
    const cached = i18nInstances.get(locale);
    if (cached) return cached;
    const instance = catalogLoaders[locale]().then((catalog) => createI18nInstance(locale, catalog.messages));
    i18nInstances.set(locale, instance);
    return instance;
}

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
    // SSR renders in the [app-ssr] bundle with the locale prop from the route param;
    // the browser reads the locale cookie so a cookie change (settings page) takes
    // effect on the next RSC refresh without navigation.
    const resolved = isServer ? resolveLocale(locale) : getLocaleFromClientCookie();

    // Suspends until the active locale's catalog chunk is loaded. On the server the
    // import resolves within the same tick; in the browser hydration waits for the
    // chunk while the server-rendered HTML stays visible, so there is no flash of
    // untranslated content. Locale switches load the new catalog inside the RSC
    // refresh transition, keeping the previous UI until it is ready.
    const i18n = use(loadI18nInstance(resolved));

    // Activate this bundle's @lingui/core singleton. Client components SSR in the
    // [app-ssr] bundle (a separate singleton from the [app-rsc] layouts); without this,
    // core macros throw "translation function without setting a locale".
    activateI18n(resolved, i18n);

    return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
