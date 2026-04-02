import { msg } from '@lingui/core/macro';

import { EventLayoutBody } from '@/app/[locale]/(event)/EventLayoutBody.js';
import { Locale } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

const LOCALES = Object.values(Locale);

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const resolved = LOCALES.includes(locale as Locale) ? (locale as Locale) : Locale.en;
    setupLocaleFromParams(resolved);

    return createSiteMetadata('/events', {
        title: await createPageTitleSSR(msg`Exclusive Events`),
    });
}

export default function Layout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
    return (
        <EventLayoutBody>
            {children}
            {modal}
        </EventLayoutBody>
    );
}
