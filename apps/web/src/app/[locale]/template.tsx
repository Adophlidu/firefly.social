import type { ReactNode } from 'react';

import { Locale } from '@/constants/enum.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

const LOCALES = Object.values(Locale);

/**
 * Template re-renders on every navigation (unlike layout which persists).
 * This ensures setI18n() is called for every RSC request, including soft
 * navigation where the layout is not re-rendered by the server.
 */
export default async function I18nTemplate({
    children,
    params,
}: {
    children: ReactNode;
    params?: Promise<{ locale?: string }>;
}) {
    const resolvedParams = params ? await params : {};
    const locale = resolvedParams.locale;
    const resolved = locale && LOCALES.includes(locale as Locale) ? (locale as Locale) : Locale.en;
    setupLocaleFromParams(resolved);

    return children;
}
