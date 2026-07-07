/**
 * Server-side i18n setup with every catalog statically imported.
 * Safe on the server (RSC / server actions / metadata) where bundle size does
 * not reach the browser. NEVER import this module from a client component —
 * it would put all six catalogs back into the client bundle; client code goes
 * through LinguiClientProvider, which dynamic-imports only the active locale.
 */
import { Locale } from '@dimensiondev/enums';
import type { I18n, Messages } from '@lingui/core';

import { activateI18n, createI18nInstance, resolveLocale } from '@/i18n/core.js';
import { messages as en } from '@/locales/en/messages.js';
import { messages as es } from '@/locales/es/messages.js';
import { messages as ja } from '@/locales/ja/messages.js';
import { messages as ko } from '@/locales/ko/messages.js';
import { messages as zhHans } from '@/locales/zh-Hans/messages.js';
import { messages as zhHant } from '@/locales/zh-Hant/messages.js';

const messages: Record<Locale, Messages> = {
    [Locale.en]: en,
    [Locale.es]: es,
    [Locale.ja]: ja,
    [Locale.ko]: ko,
    [Locale.zhHans]: zhHans,
    [Locale.zhHant]: zhHant,
};

const locales = Object.keys(messages) as Locale[];

const allLocales: Record<string, I18n> = Object.fromEntries(
    locales.map((locale) => [locale, createI18nInstance(locale, messages[locale])]),
);

export function setupAndActiveI18n(locale_: Locale) {
    const locale = resolveLocale(locale_);
    return activateI18n(locale, allLocales[locale]);
}
