import { Locale, SiteCookies } from '@dimensiondev/enums';
import { hydrateApp } from '@dimensiondev/ssr/client';
import { bom } from '@dimensiondev/utils';
import { modules, tree } from 'virtual:ssr/routes';

import { preloadDynamics } from '@/compat/dynamic.js';
import { preloadI18n } from '@/components/LinguiClientProvider.js';
import { rewriteInternalPathname } from '@/helpers/rewriteInternalPathname.js';

function resolvePreloadLocale(): Locale {
    const cookie = bom.document?.cookie.match(new RegExp(`(?:^|;\\s*)${SiteCookies.Locale}=([^;]*)`))?.[1];
    if (cookie && Object.values(Locale).includes(decodeURIComponent(cookie) as Locale)) {
        return decodeURIComponent(cookie) as Locale;
    }
    return Locale.en;
}

// Warm the lazy chunks the streamed suspense boundaries depend on before
// hydration starts, so they resolve synchronously and match the server DOM.
await Promise.all([preloadI18n(resolvePreloadLocale()), preloadDynamics()]);

void hydrateApp({
    tree,
    modules,
    history: 'browser',
    rewritePathname: rewriteInternalPathname,
});
