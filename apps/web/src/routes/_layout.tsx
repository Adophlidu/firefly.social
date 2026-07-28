import { Locale } from '@dimensiondev/enums';
import { type LoaderContext, useLoaderData } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { AppLayoutBody } from '@/compat/AppLayoutBody.js';
import { AgentProvider } from '@/components/AgentProvider.js';
import { LangSetter } from '@/components/LangSetter.js';
import { NavigationProgress } from '@/components/NavigationProgress.js';
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
    // Fallback for transitions whose error/notFound state precedes the data.
    const { locale } = useLoaderData<{ locale: Locale } | undefined>('_layout.tsx') ?? {};
    const resolvedLocale = locale ?? Locale.en;

    return (
        <AgentProvider>
            <NavigationProgress />
            <LangSetter locale={resolvedLocale} />
            <AppLayoutBody locale={resolvedLocale}>{children}</AppLayoutBody>
        </AgentProvider>
    );
}
