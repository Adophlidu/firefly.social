import { ActivityStatus } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';

import { ActivityHeader } from '@/components/Activity/ActivityHeader.js';
import { dynamic } from '@/esm/dynamic.js';
import { notFound } from '@/esm/navigation/server.js';
import { getFireflyActivityInfo } from '@/providers/firefly/activity/getFireflyActivityInfo.js';
import { createEventMetadata } from '@/providers/firefly/metadata/createEventMetadata.js';

export const revalidate = 300;

const ActivityNavigationBar = dynamic(
    () => import('@/components/Activity/ActivityNavigationBar.js').then((m) => m.ActivityNavigationBar),
    { ssr: false },
);
const ActivityTasks = dynamic(
    () => import('@/components/Activity/ActivityTasks/index.js').then((m) => m.ActivityTasks),
    { ssr: false },
);
const ActivityEndedDialog = dynamic(
    () => import('@/components/Activity/ActivityEndedDialog.js').then((m) => m.ActivityEndedDialog),
    { ssr: false },
);

interface Props extends LayoutProps<{ name: string }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { name } = await props.params;
    return createEventMetadata(name, `/event/${name}`);
}

export default async function Page(props: Props) {
    const { name } = await props.params;
    const data = await runInSafeAsync(() => getFireflyActivityInfo(name));
    if (!data) notFound();

    return (
        <div className="flex min-h-svh w-full flex-1 flex-col">
            <ActivityNavigationBar>{data.title}</ActivityNavigationBar>
            <ActivityHeader data={data} />
            <ActivityTasks data={data} name={name} />
            {data.status === ActivityStatus.Ended ? <ActivityEndedDialog data={data} /> : null}
        </div>
    );
}
