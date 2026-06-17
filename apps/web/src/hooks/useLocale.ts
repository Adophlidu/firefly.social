import { Locale, SiteCookies } from '@dimensiondev/enums';
import { bom, isValidEnumValue } from '@dimensiondev/utils';
import { useLingui } from '@lingui/react';

import { resolveLanguageLocale, resolveLocale } from '@/helpers/resolveLocale.js';
import { useCookie } from '@/hooks/useCookie.js';

export function useLocale(): Locale {
    // Use Lingui's active locale for SSR/client consistency (avoids hydration mismatch).
    const { i18n } = useLingui();
    // Read cookie unconditionally to satisfy React hooks rules (no conditional hook calls)
    const localeFromCookie = useCookie(SiteCookies.Locale);

    if (i18n?.locale && isValidEnumValue(i18n.locale, Locale)) {
        return i18n.locale as Locale;
    }

    // Fallback: read from cookie (client-only)
    const locale = localeFromCookie || resolveLanguageLocale(bom.navigator?.language);
    return resolveLocale(locale);
}
