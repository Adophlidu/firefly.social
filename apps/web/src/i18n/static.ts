/**
 * ISR-safe i18n setup — no cookies/headers dependency.
 * Import this module instead of '@/i18n/index.js' in layouts/pages that need ISR/SSG.
 */
import { getI18n } from '@lingui/react/server';

import type { Locale } from '@/constants/enum.js';
import { setupAndActiveI18n } from '@/i18n/core.js';

export function setupLocaleFromParams(locale: Locale) {
    const instance = getI18n();
    if (instance) return instance;
    return setupAndActiveI18n(locale);
}
