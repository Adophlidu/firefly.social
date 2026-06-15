import type { Locale } from '@dimensiondev/enums';
import { useLingui } from '@lingui/react';

import { resolveLocale } from '@/helpers/resolveLocale.js';

/**
 * Returns the active Lingui locale as a typed {@link Locale}.
 *
 * Lingui types `i18n.locale` as a plain `string`, which otherwise forces every
 * caller to write `locale as Locale`. This validates the value once and falls
 * back to {@link Locale.en} for any unrecognized locale.
 */
export function useLocale(): Locale {
    const {
        i18n: { locale },
    } = useLingui();
    return resolveLocale(locale);
}
