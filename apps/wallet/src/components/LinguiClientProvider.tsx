import { I18nProvider } from '@lingui/react';
import { isServer } from '@tanstack/react-query';
import { type PropsWithChildren, useMemo } from 'react';

import { getLocaleFromCookies } from '@/helpers/getCookies.js';
import { setupAndActiveI18n, setupLocalForClient } from '@/i18n/index.js';

type LinguiClientProviderProps = PropsWithChildren<{}>;

export function LinguiClientProvider({ children }: LinguiClientProviderProps) {
    if (isServer) {
        const locale = getLocaleFromCookies();
        return locale.then((locale) => <I18nProvider i18n={setupAndActiveI18n(locale)}>{children}</I18nProvider>);
    }
    return <Client>{children}</Client>;
}

function Client({ children }: PropsWithChildren) {
    // Run setup during render (not useLayoutEffect) so that dayjs locale is set
    // before child components render and call dayjs().format().
    const i18n = useMemo(() => setupLocalForClient(), []);
    return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
