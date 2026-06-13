import { Locale } from '@dimensiondev/enums';
import { useLingui } from '@lingui/react';
import { useMemo } from 'react';

import { GAME_COUNTRIES } from '@/constants/gameCountries.js';

const normalize = (value: string) => value.trim().toLowerCase();

// Locale-independent: any known alias (Polymarket name, code, or a localized name) → country code.
const ALIAS_TO_CODE = new Map<string, string>();
for (const country of GAME_COUNTRIES) {
    for (const pmName of country.pmNames) ALIAS_TO_CODE.set(normalize(pmName), country.code);

    for (const localizedName of Object.values(country.names)) ALIAS_TO_CODE.set(normalize(localizedName), country.code);
}

/**
 * The sports list/detail APIs do not localize team (country) names for every locale,
 * so we translate them client-side against the baked-in {@link GAME_COUNTRIES} list.
 *
 * Returns a resolver that maps a raw team name to the localized country name when it
 * matches a known country, otherwise returns the original name unchanged.
 */
export function useLocalizedSportsTeamName(): (name: string) => string {
    const {
        i18n: { locale },
    } = useLingui();

    return useMemo(() => {
        const targetLocale = Object.values(Locale).includes(locale as Locale) ? (locale as Locale) : Locale.en;
        const codeToName = new Map(GAME_COUNTRIES.map((country) => [country.code, country.names[targetLocale]]));

        return (name: string) => {
            const code = ALIAS_TO_CODE.get(normalize(name));
            return (code ? codeToName.get(code) : undefined) ?? name;
        };
    }, [locale]);
}
