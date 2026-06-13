import type { Locale } from '@dimensiondev/enums';
import { useLingui } from '@lingui/react';
import { useMemo } from 'react';

import { useGameCountriesStore } from '@/store/useGameCountriesStore.js';

/**
 * The sports list API does not localize team (country) names, so we fall back to the
 * localized country list and translate any team name that matches a known country.
 *
 * Returns a resolver that maps a raw team name to the localized country name when a
 * match is found, otherwise returns the original name unchanged.
 */
export function useLocalizedSportsTeamName(): (name: string) => string {
    const {
        i18n: { locale },
    } = useLingui();
    const gameCountries = useGameCountriesStore.use.gameCountries();

    return useMemo(() => {
        const countries = gameCountries[locale as Locale] ?? [];

        // Polymarket country names are locale-independent identifiers, so matching
        // against the localized list directly yields the translated country_name.
        const lookup = new Map<string, string>();
        for (const country of countries) {
            if (!country.country_name) continue;

            for (const pmName of country.pm_country_names ?? []) {
                if (pmName) lookup.set(pmName.trim().toLowerCase(), country.country_name);
            }

            lookup.set(country.country_name.trim().toLowerCase(), country.country_name);
        }

        return (name: string) => lookup.get(name.trim().toLowerCase()) ?? name;
    }, [gameCountries, locale]);
}
