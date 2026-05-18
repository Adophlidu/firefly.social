'use client';

import { Locale } from '@dimensiondev/enums';
import { I18nProvider } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { LayoutBody } from '@/app/layout-body.js';
import { AgentProvider } from '@/components/AgentProvider.js';
import { BaseNotFound } from '@/components/BaseNotFound.js';
import { Link } from '@/components/Link.js';
import { PageRoute } from '@/constants/enum.js';
import { getI18nInstance, setupAndActiveI18n } from '@/i18n/core.js';

function getLocaleFromCookie(): Locale {
    if (typeof document === 'undefined') return Locale.en;
    const pair = document.cookie.split('; ').find((x) => x.startsWith('locale='));
    if (!pair) return Locale.en;
    const value = pair.split('=')[1];
    return Object.values(Locale).includes(value as Locale) ? (value as Locale) : Locale.en;
}

export default function NotFound() {
    const locale = getLocaleFromCookie();
    setupAndActiveI18n(locale);

    return (
        <I18nProvider i18n={getI18nInstance(locale)}>
            <AgentProvider>
                <LayoutBody locale={locale}>
                    <NuqsAdapter>
                        <BaseNotFound className="min-h-screen grow md:pl-[235px] lg:pl-[289px]">
                            <div className="mt-11 text-sm font-bold">
                                <Trans>The page could not be found.</Trans>
                            </div>
                            <Link className="text-link underline md:hidden" href={PageRoute.Home}>
                                <Trans>Back to home</Trans>
                            </Link>
                        </BaseNotFound>
                    </NuqsAdapter>
                </LayoutBody>
            </AgentProvider>
        </I18nProvider>
    );
}
