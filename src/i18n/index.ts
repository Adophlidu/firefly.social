import { bom } from '@firefly/utils';
import { i18n as i18nCore, type Messages, setupI18n } from '@lingui/core';
import { getI18n, setI18n } from '@lingui/react/server';
import dayjs from 'dayjs';

import { Locale } from '@/constants/enum.js';
import { getLocaleFromCookies, getLocalFromClientCookies, resolveLanguageLocale } from '@/helpers/getCookies.js';
import { messages as en } from '@/locales/en/messages.js';
import { messages as zhHans } from '@/locales/zh-Hans/messages.js';
import { messages as zhHant } from '@/locales/zh-Hant/messages.js';

export const supportedLocales: Record<Locale, string> = {
    [Locale.en]: 'English',
    [Locale.zhHans]: '简体中文',
    [Locale.zhHant]: '繁體中文',
};

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

function resolveLocale(locale: Locale) {
    if (!supportedLocales.hasOwnProperty(locale)) {
        console.error(`[i18n]: unknown locale ${locale}`);
        return resolveLanguageLocale(bom.navigator?.language);
    }
    return locale;
}

export function setupAndActiveI18n(locale_: Locale) {
    const locale = resolveLocale(locale_);

    // on the client side, we need to setup the global i18n instance
    // in order to use core macros on the client components
    if (bom.document) {
        i18nCore.loadAndActivate({
            locale,
            locales: Object.keys(supportedLocales) as Locale[],
            messages: messages[locale],
        });
    }

    const i18n = allLocales[locale];
    i18n.activate(locale);

    setI18n(i18n as unknown as Parameters<typeof setI18n>[0]);
    dayjs.locale(locale);

    return i18n;
}

export function getI18nInstance(locale_: Locale) {
    const locale = resolveLocale(locale_);

    return allLocales[locale];
}

export async function setupLocaleForSSR() {
    const instance = getI18n();
    if (instance) return instance;

    const locale = await getLocaleFromCookies();
    const i18n = setupAndActiveI18n(locale);
    return i18n;
}

/**
 * set locale and dynamically import catalog
 * @param locale a supported locale string
 */
export function setupLocalForClient() {
    const locale = getLocalFromClientCookies();
    const i18n = setupAndActiveI18n(locale);
    return i18n;
}
