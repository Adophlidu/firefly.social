import { Locale } from '@dimensiondev/enums';
import { isValidEnumValue } from '@dimensiondev/utils';

/**
 * Validates an arbitrary locale string against the {@link Locale} enum,
 * falling back to {@link Locale.en} for any unrecognized or missing value.
 *
 * This is the single place the `string → Locale` narrowing happens, so callers
 * don't have to scatter `value as Locale` assertions.
 */
export function resolveLocale(value: string | undefined): Locale {
    return value && isValidEnumValue(value, Locale) ? (value as Locale) : Locale.en;
}
