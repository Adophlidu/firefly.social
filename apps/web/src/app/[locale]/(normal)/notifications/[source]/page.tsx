'use client';

import type { NotificationSource, SourceInURL } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { use } from 'react';

import { FireflyNotifications } from '@/app/[locale]/(normal)/notifications/[source]/pages/FireflyNotifications.js';
import { SocialNotifications } from '@/app/[locale]/(normal)/notifications/[source]/pages/SocialNotifications.js';
import { Loading } from '@/components/Loading.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';

interface Props extends LayoutProps<{ source: SourceInURL }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    const source = resolveSource(params.source) as NotificationSource;
    const syncing = useAsyncStatusAll();

    if (syncing) {
        return <Loading />;
    }

    if (source === Source.Notifications) {
        return <FireflyNotifications />;
    }

    return <SocialNotifications source={source} />;
}
