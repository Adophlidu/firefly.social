import { Locale } from '@dimensiondev/enums';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { LayoutBody } from '@/app/layout-body.js';
import { AgentProvider } from '@/components/AgentProvider.js';
import { NotFoundView } from '@/components/NotFoundView.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

// The root not-found boundary must not touch dynamic APIs (cookies/headers). In Next 16 a
// dynamic API here forces every route in the app to render as ƒ Dynamic, silently disabling
// ISR/CDN caching site-wide. Hardcode Locale.en instead of reading the locale cookie — this
// mirrors [locale]/not-found.tsx, which also hardcodes Locale.en.
export default function NotFound() {
    const locale = Locale.en;
    setupLocaleFromParams(locale);

    return (
        <AgentProvider>
            <LayoutBody locale={locale}>
                <NuqsAdapter>
                    <NotFoundView />
                </NuqsAdapter>
            </LayoutBody>
        </AgentProvider>
    );
}
