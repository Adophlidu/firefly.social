import { Locale } from '@dimensiondev/enums';
import { type LoaderContext, useLoaderData } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { LangSetter } from '@/components/LangSetter.js';
import { AppProviders } from '@/compat/AppProviders.js';

const LOCALES = Object.values(Locale);

export async function loader({ params }: LoaderContext) {
    const locale = LOCALES.includes(params.locale as Locale) ? (params.locale as Locale) : Locale.en;

    // Server-only: statically-registered catalogs + dayjs locale + the RSC-layer
    // i18n context, mirroring setupLocaleFromParams in the Next [locale] layout.
    // Guarded so the client bundle neither ships all six catalogs nor evaluates
    // the server module (the dynamic import still ends up as a lazy chunk).
    if (import.meta.env.SSR) {
        const { setupLocaleFromParams } = await import('@/i18n/static.js');
        setupLocaleFromParams(locale);
    }

    return { locale };
}

export default function LocaleLayout({ children }: { children?: ReactNode }) {
    // Loader data is keyed by route file path; default useLoaderData() reads the
    // matched page's data, so a layout must pass its own file explicitly.
    const { locale } = useLoaderData<{ locale: Locale }>('$locale/_layout.tsx');

    return (
        <>
            <LangSetter locale={locale} />
            <AppProviders locale={locale}>{children}</AppProviders>
        </>
    );
}
