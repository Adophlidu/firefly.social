'use client';

import { use } from 'react';

import { FireflyNotifications } from '@/app/(normal)/notifications/[source]/pages/FireflyNotifications.js';
import { SocialNotifications } from '@/app/(normal)/notifications/[source]/pages/SocialNotifications.js';
import { type NotificationSource, Source, SourceInURL } from '@/constants/enum.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ source: SourceInURL }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    const source = resolveSource(params.source) as NotificationSource;

    if (source === Source.Notifications) {
        return <FireflyNotifications />;
    }

    return <SocialNotifications source={source} />;
}
