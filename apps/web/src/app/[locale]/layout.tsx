import { Locale } from '@dimensiondev/enums';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode, Suspense } from 'react';

import { LayoutBody } from '@/app/layout-body.js';
import { AgentProvider } from '@/components/AgentProvider.js';
import { LangSetter } from '@/components/LangSetter.js';
import { VercelRegion } from '@/components/VercelRegion.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

const LOCALES = Object.values(Locale);

export function generateStaticParams() {
    return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const resolved = LOCALES.includes(locale as Locale) ? (locale as Locale) : Locale.en;

    setupLocaleFromParams(resolved);

    return (
        <>
            <LangSetter locale={resolved} />
            <VercelRegion />
            <AgentProvider>
                <Suspense>
                    <LayoutBody locale={resolved}>
                        <NuqsAdapter>{children}</NuqsAdapter>
                    </LayoutBody>
                </Suspense>
            </AgentProvider>
        </>
    );
}
