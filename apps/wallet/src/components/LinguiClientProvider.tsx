import { I18nProvider } from '@lingui/react';
import { isServer } from '@tanstack/react-query';
import { type PropsWithChildren, useLayoutEffect, useMemo } from 'react';

import { getLocaleFromCookies, getLocalFromClientCookies } from '@/helpers/getCookies.js';
import { getI18nInstance, setupAndActiveI18n, setupLocalForClient } from '@/i18n/index.js';

type LinguiClientProviderProps = PropsWithChildren<{}>;

export function LinguiClientProvider({ children }: LinguiClientProviderProps) {
    if (isServer) {
        const locale = getLocaleFromCookies();
        return locale.then((locale) => <I18nProvider i18n={setupAndActiveI18n(locale)}>{children}</I18nProvider>);
    }
    return <Client>{children}</Client>;
}

function Client({ children }: PropsWithChildren) {
    useLayoutEffect(() => {
        setupLocalForClient();
    }, []);

    const locale = useMemo(() => getLocalFromClientCookies(), []);
    return <I18nProvider i18n={getI18nInstance(locale)}>{children}</I18nProvider>;
}
