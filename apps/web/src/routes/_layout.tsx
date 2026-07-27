import { Locale } from '@dimensiondev/enums';
import { type LoaderContext, useLoaderData } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { AgentProvider } from '@/components/AgentProvider.js';
import { NavigationProgress } from '@/components/NavigationProgress.js';
import { LangSetter } from '@/components/LangSetter.js';
import { AppLayoutBody } from '@/compat/AppLayoutBody.js';
import { resolveRequestLocale } from '@/helpers/resolveRequestLocale.js';

/**
 * Root layout: locale is resolved per request (cookie → Accept-Language →
 * 'en') — no locale prefix in URLs. Anonymous requests (no cookie) can be
 * CDN-cached in English; cookied requests bypass the CDN and render in the
 * user's locale.
 */
export async function loader({ request }: LoaderContext) {
    const locale = resolveRequestLocale(request);

    if (import.meta.env.SSR) {
        const { setupLocaleFromParams } = await import('@/i18n/static.js');
        setupLocaleFromParams(locale);
    }

    return { locale };
}

export default function RootLayout({ children }: { children?: ReactNode }) {
    const { locale } = useLoaderData<{ locale: Locale }>('_layout.tsx');

    return (
        <AgentProvider>
            <NavigationProgress />
            <LangSetter locale={locale} />
            <AppLayoutBody locale={locale}>{children}</AppLayoutBody>
        </AgentProvider>
    );
}
