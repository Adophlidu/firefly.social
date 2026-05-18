import { Locale } from '@dimensiondev/enums';
import type { ReactNode } from 'react';

import { setupLocaleFromParams } from '@/i18n/static.js';

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
    setupLocaleFromParams(locale || Locale.en);

    return children;
}
