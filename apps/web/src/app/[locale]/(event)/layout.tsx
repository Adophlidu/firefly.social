import { msg } from '@lingui/core/macro';

import { EventLayoutBody } from '@/app/[locale]/(event)/EventLayoutBody.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setupLocaleFromParams(locale);

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
