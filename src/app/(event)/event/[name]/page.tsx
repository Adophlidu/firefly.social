import type { Metadata } from 'next';

import { ActivityHeader } from '@/components/Activity/ActivityHeader.js';
import { dynamic } from '@/esm/dynamic.js';
import { notFound } from '@/esm/navigation/server.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyActivityProvider } from '@/providers/firefly/Activity.js';
import { fireflyMetadataProvider } from '@/providers/firefly/Metadata.js';
import { ActivityStatus } from '@/providers/types/Firefly.js';
import type { NextPageProps } from '@/types/utility.js';

const ActivityNavigationBar = dynamic(() => import('@/components/Activity/ActivityNavigationBar.js'), { ssr: false });
const ActivityEndedDialog = dynamic(() => import('@/components/Activity/ActivityEndedDialog.js'), { ssr: false });

interface Props extends NextPageProps<{ name: string }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { name } = await props.params;
    return fireflyMetadataProvider.createEventMetadata(name, `/event/${name}`);
}

export default async function Page(props: Props) {
    const { name } = await props.params;
    const data = await runInSafeAsync(() => FireflyActivityProvider.getFireflyActivityInfo(name));
    if (!data) notFound();

    return (
        <div className="flex min-h-svh w-full flex-1 flex-col">
            <ActivityNavigationBar>{data.title}</ActivityNavigationBar>
            <ActivityHeader data={data} />
            {data.status === ActivityStatus.Ended ? <ActivityEndedDialog data={data} /> : null}
        </div>
    );
}
