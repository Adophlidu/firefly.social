/**
 * Client-safe i18n primitives — deliberately catalog-free.
 * Do NOT statically import compiled catalogs (`@/locales/...`) here: this module
 * is part of every client bundle via LinguiClientProvider, and importing catalogs
 * would ship all locales to every visitor. Server code that needs every catalog
 * statically should import '@/i18n/server.js' instead.
 */
import { Locale } from '@dimensiondev/enums';
import { type I18n, i18n as i18nCore, type Messages, setupI18n } from '@lingui/core';
import { setI18n } from '@lingui/react/server';
import dayjs from 'dayjs';

import { getDayjsLocaleName } from '@/helpers/dayjsLocale.js';
import { logger } from '@/libs/Logger.js';

export const supportedLocales: Record<Locale, string> = {
    [Locale.en]: 'English',
    [Locale.es]: 'Español',
    [Locale.ja]: '日本語',
    [Locale.ko]: '한국어',
    [Locale.zhHans]: '简体中文',
    [Locale.zhHant]: '繁體中文',
};

export function resolveLocale(locale: Locale, fallback?: () => Locale): Locale {
    if (supportedLocales.hasOwnProperty(locale)) return locale;
    logger.error(`[i18n]: unknown locale ${locale}`);
    return fallback ? fallback() : Locale.en;
}

export function createI18nInstance(locale: Locale, messages: Messages): I18n {
    return setupI18n({
        // `locales` is the Intl fallback chain for this locale, not the supported-locales list.
        locale,
        locales: [locale],
        messages: { [locale]: messages },
    });
}

export function activateI18n(locale: Locale, i18n: I18n): I18n {
    // Activate the global @lingui/core singleton so that core macros
    // (t`...` / msg`...` from @lingui/core/macro, which compile to i18nCore._())
    // resolve during SSR/ISR and in the browser. The RSC layer
    // (<Trans>/msg from @lingui/react) stays request-correct via setI18n()/React.cache().
    i18nCore.loadAndActivate({
        locale,
        locales: [locale],
        messages: i18n.messages,
    });

    setI18n(i18n as unknown as Parameters<typeof setI18n>[0]);
    dayjs.locale(getDayjsLocaleName(locale));

    return i18n;
}
