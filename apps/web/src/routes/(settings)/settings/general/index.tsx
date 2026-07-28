import type { ThemeMode } from '@dimensiondev/enums';
import { Locale, SiteCookies } from '@dimensiondev/enums';
import { getEnumAsArray } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { isServer } from '@tanstack/react-query';
import { useMediaQuery } from 'usehooks-ts';

import { OptionButton } from '@/legacy/[locale]/(settings)/components/OptionButton.js';
import { SettingsSection } from '@/legacy/[locale]/(settings)/components/Section.js';
import { Subtitle } from '@/legacy/[locale]/(settings)/components/Subtitle.js';
import { useCookie } from '@/hooks/useCookie.js';
import { useLocale } from '@/hooks/useLocale.js';
import { supportedLocales } from '@/i18n/core.js';
import { logger } from '@/libs/Logger.js';
import { useThemeModeStore } from '@/store/useThemeModeStore.js';

export default function General() {
    const setThemeMode = useThemeModeStore.use.setThemeMode();
    const mode = useThemeModeStore.use.themeMode();
    const isDarkOS = useMediaQuery('(prefers-color-scheme: dark)');
    const locale = useLocale();
    const rootClass = useCookie(SiteCookies.FireflyRootClass);

    return (
        <SettingsSection title={<Trans>General</Trans>}>
            <Subtitle>
                <Trans>Display</Trans>
            </Subtitle>

            <div className="flex min-h-[220px] flex-col gap-5">
                {[
                    {
                        value: 'default',
                        label: <Trans>Follow System</Trans>,
                    },
                    {
                        value: 'light',
                        label: <Trans>Light Mode</Trans>,
                    },
                    {
                        value: 'dark',
                        label: <Trans>Dark Mode</Trans>,
                    },
                ].map((option, index) => (
                    <OptionButton
                        key={index}
                        darkMode={
                            option.value === 'default'
                                ? isServer
                                    ? rootClass === 'dark'
                                    : isDarkOS
                                : option.value === 'dark'
                        }
                        selected={mode === option.value}
                        label={option.label}
                        onClick={() => {
                            setThemeMode(option.value as ThemeMode);
                        }}
                    />
                ))}
            </div>

            <Subtitle>
                <Trans>Language</Trans>
            </Subtitle>

            <div className="flex min-h-[220px] flex-col gap-5">
                {getEnumAsArray(Locale).map((option, index) => (
                    <OptionButton
                        key={index}
                        selected={option.value === locale}
                        darkMode={mode === 'default' ? (isServer ? rootClass === 'dark' : isDarkOS) : mode === 'dark'}
                        label={supportedLocales[option.value]}
                        onClick={() => {
                            logger.warn('[18n] change locale', option.value);

                            // Write the locale cookie and reload — the next SSR pass
                            // renders the whole app in the new locale (the old
                            // changeCookies server action + RSC refresh equivalent).
                            document.cookie = `${SiteCookies.Locale}=${option.value}; path=/; max-age=31536000`;
                            location.reload();
                        }}
                    />
                ))}
            </div>
        </SettingsSection>
    );
}
