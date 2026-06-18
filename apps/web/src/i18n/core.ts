import { Locale } from '@dimensiondev/enums';
import { i18n as i18nCore, type Messages, setupI18n } from '@lingui/core';
import { setI18n } from '@lingui/react/server';
import dayjs from 'dayjs';

import { getDayjsLocaleName } from '@/helpers/dayjsLocale.js';
import { logger } from '@/libs/Logger.js';
import { messages as en } from '@/locales/en/messages.js';
import { messages as es } from '@/locales/es/messages.js';
import { messages as ja } from '@/locales/ja/messages.js';
import { messages as ko } from '@/locales/ko/messages.js';
import { messages as zhHans } from '@/locales/zh-Hans/messages.js';
import { messages as zhHant } from '@/locales/zh-Hant/messages.js';

export const supportedLocales: Record<Locale, string> = {
    [Locale.en]: 'English',
    [Locale.es]: 'Español',
    [Locale.ja]: '日本語',
    [Locale.ko]: '한국어',
    [Locale.zhHans]: '简体中文',
    [Locale.zhHant]: '繁體中文',
};

const messages: Record<Locale, Messages> = {
    [Locale.en]: en,
    [Locale.es]: es,
    [Locale.ja]: ja,
    [Locale.ko]: ko,
    [Locale.zhHans]: zhHans,
    [Locale.zhHant]: zhHant,
};

const locales = Object.keys(messages) as Locale[];

const allLocales = Object.fromEntries(
    locales.map((locale) => [
        locale,
        setupI18n({
            // `locales` is the Intl fallback chain for this locale, not the supported-locales list.
            locale,
            locales: [locale],
            messages,
        }),
    ]),
);

export function resolveLocale(locale: Locale, fallback?: () => Locale): Locale {
    if (supportedLocales.hasOwnProperty(locale)) return locale;
    logger.error(`[i18n]: unknown locale ${locale}`);
    return fallback ? fallback() : Locale.en;
}

export function setupAndActiveI18n(locale_: Locale) {
    const locale = resolveLocale(locale_);

    // Activate the global @lingui/core singleton so that core macros
    // (t`...` / msg`...` from @lingui/core/macro, which compile to i18nCore._())
    // resolve during SSR/ISR — not only in the browser. The RSC layer
    // (<Trans>/msg from @lingui/react) stays request-correct via setI18n()/React.cache() below.
    i18nCore.loadAndActivate({
        locale,
        locales: [locale],
        messages: messages[locale],
    });

    const i18n = allLocales[locale];

    setI18n(i18n as unknown as Parameters<typeof setI18n>[0]);
    dayjs.locale(getDayjsLocaleName(locale));

    return i18n;
}

export function getI18nInstance(locale_: Locale) {
    const locale = resolveLocale(locale_);
    return allLocales[locale];
}
