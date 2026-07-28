/**
 * Request-context-free i18n setup — no cookies/headers dependency, safe to use
 * in loaders and layouts where the active locale is already known.
 */
import { Locale } from '@dimensiondev/enums';
import { getI18n } from '@lingui/react/server';

import { setupAndActiveI18n } from '@/i18n/server.js';

const LOCALES = Object.values(Locale);

export function setupLocaleFromParams(locale: string, fallback: Locale = Locale.en) {
    const instance = getI18n();
    if (instance) return instance;
    const resolved = locale && LOCALES.includes(locale as Locale) ? (locale as Locale) : fallback;
    return setupAndActiveI18n(resolved);
}
