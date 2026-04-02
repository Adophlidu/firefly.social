'use client';

import { getEnumAsArray } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { isServer } from '@tanstack/react-query';
import { useMediaQuery } from 'usehooks-ts';

import { changeCookies } from '@/actions/changeCookies.js';
import { OptionButton } from '@/app/[locale]/(settings)/components/OptionButton.js';
import { SettingsSection } from '@/app/[locale]/(settings)/components/Section.js';
import { Subtitle } from '@/app/[locale]/(settings)/components/Subtitle.js';
import { Locale, SiteCookies, type ThemeMode } from '@/constants/enum.js';
import { useCookie, useLocale } from '@/helpers/getCookies.js';
import { supportedLocales } from '@/i18n/index.js';
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
                        onClick={async () => {
                            logger.warn('[18n] change locale', option.value);

                            const data = new FormData();
                            data.append('locale', option.value);
                            await changeCookies(data);
                        }}
                    />
                ))}
            </div>
        </SettingsSection>
    );
}
