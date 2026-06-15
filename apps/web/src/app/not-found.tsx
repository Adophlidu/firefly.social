import { Locale } from '@dimensiondev/enums';
import { cookies } from 'next/headers.js';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { LayoutBody } from '@/app/layout-body.js';
import { AgentProvider } from '@/components/AgentProvider.js';
import { NotFoundView } from '@/components/NotFoundView.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

async function getLocaleFromCookie(): Promise<Locale> {
    const value = await cookies().then((store) => store.get('locale')?.value);
    return value && Object.values(Locale).includes(value as Locale) ? (value as Locale) : Locale.en;
}

export default async function NotFound() {
    const locale = await getLocaleFromCookie();
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
