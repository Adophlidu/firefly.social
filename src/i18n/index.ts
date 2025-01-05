import type { I18n, Messages } from '@lingui/core' with { 'resolution-mode': 'require' };
import { i18n, setupI18n } from '@lingui/core';
import { setI18n } from '@lingui/react/server';
import dayjs from 'dayjs';

import { Locale } from '@/constants/enum.js';
import { getLocaleFromCookiesAsync } from '@/helpers/getCookie.js';
// @ts-expect-error
import { messages as en } from '@/locales/en/messages.mjs';
// @ts-expect-error
import { messages as zhHans } from '@/locales/zh-Hans/messages.mjs';
// @ts-expect-error
import { messages as zhHant } from '@/locales/zh-Hant/messages.mjs';

const messages: Record<Locale, Messages> = {
    [Locale.en]: en,
    [Locale.zhHans]: zhHans,
    [Locale.zhHant]: zhHant,
};

const locales = Object.keys(messages) as Locale[];

const allLocales = Object.fromEntries(
    locales.map((locale) => [
        locale,
        setupI18n({
            locale,
            locales,
            messages,
        }),
    ]),
);

export const supportedLocales: Record<Locale, string> = {
    [Locale.en]: 'English',
    [Locale.zhHans]: '简体中文',
    [Locale.zhHant]: '繁體中文',
};

export const defaultLocale = Locale.en;

export async function setupLocaleForSSR() {
    const i18n = allLocales[await getLocaleFromCookiesAsync()];
    setI18n(i18n as any);
}

export function getI18nInstance(locale: Locale): I18n {
    return allLocales[locale] as any;
}

/**
 * set locale and dynamically import catalog
 * @param locale a supported locale string
 */
export function setLocale(locale: Locale) {
    if (!supportedLocales.hasOwnProperty(locale)) {
        console.error(`[i18n]: unknown locale ${locale}`);
        locale = defaultLocale;
    } else {
        console.log(`[i18n]: locale ${locale}`);
    }

    // lingui macro uses the core i18n
    i18n.loadAndActivate({
        locale,
        locales,
        messages: messages[locale],
    });
    dayjs.locale(locale);
}

export function getLocale(locale: Locale) {
    return messages[locale];
}
