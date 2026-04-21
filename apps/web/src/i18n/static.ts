/**
 * ISR-safe i18n setup — no cookies/headers dependency.
 * Import this module instead of '@/i18n/index.js' in layouts/pages that need ISR/SSG.
 */
import { getI18n } from '@lingui/react/server';

import { Locale } from '@/constants/enum.js';
import { setupAndActiveI18n } from '@/i18n/core.js';

const LOCALES = Object.values(Locale);

export function setupLocaleFromParams(locale: string, fallback: Locale = Locale.en) {
    const instance = getI18n();
    if (instance) return instance;
    const resolved = locale && LOCALES.includes(locale as Locale) ? (locale as Locale) : fallback;
    return setupAndActiveI18n(resolved);
}
