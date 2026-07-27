import type { NotificationSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { useParams } from '@dimensiondev/ssr';

import { FireflyNotifications } from '@/app/[locale]/(normal)/notifications/[source]/pages/FireflyNotifications.js';
import { SocialNotifications } from '@/app/[locale]/(normal)/notifications/[source]/pages/SocialNotifications.js';
import { Loading } from '@/components/Loading.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';

export default function NotificationSourcePage() {
    const params = useParams();
    const source = resolveSource(params.source as never) as NotificationSource;
    const syncing = useAsyncStatusAll();

    if (syncing) {
        return <Loading />;
    }

    if (source === Source.Notifications) {
        return <FireflyNotifications />;
    }

    return <SocialNotifications source={source} />;
}
