import type { I18n, Messages } from '@lingui/core' with { 'resolution-mode': 'require' };
import { i18n, setupI18n } from '@lingui/core';
import { setI18n } from '@lingui/react/server';
import dayjs from 'dayjs';

import { Locale } from '@/constants/enum.js';
import { getLocaleFromCookies } from '@/helpers/getCookies.js';
import { messages as en } from '@/locales/en/messages.js';
import { messages as zhHans } from '@/locales/zh-Hans/messages.js';
import { messages as zhHant } from '@/locales/zh-Hant/messages.js';

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

export function getI18n(locale: Locale): I18n {
    const instance = getI18nInstance(locale);
    return instance;
}

export async function setupLocaleForSSR() {
    const locale = await getLocaleFromCookies();
    const i18n = getI18n(locale);
    setI18n(i18n);
    setLocale(i18n.locale as Locale);
}

export function getI18nInstance(locale: Locale): I18n {
    return (allLocales[locale] ?? allLocales[Locale.en]!) as unknown as I18n;
}

/**
 * set locale and dynamically import catalog
 * @param locale a supported locale string
 */
export function setLocale(locale: Locale) {
    if (!supportedLocales.hasOwnProperty(locale)) {
        console.error(`[i18n]: unknown locale ${locale}`);
        locale = defaultLocale;
    }

    // lingui macro uses the core i18n
    i18n.load(messages);
    i18n.activate(locale);
    dayjs.locale(locale);
}

export function getLocale(locale: Locale) {
    return messages[locale];
}
