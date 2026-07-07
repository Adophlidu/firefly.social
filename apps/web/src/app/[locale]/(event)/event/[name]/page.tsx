import { ActivityStatus } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { ActivityHeader } from '@/components/Activity/ActivityHeader.js';
import { dynamic } from '@/esm/dynamic.js';
import { notFound } from '@/esm/navigation/server.js';
import { getEventPageData } from '@/providers/firefly/metadata/getEventPageData.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageMetadata.js';

export const revalidate = 300;

// Static-class stub: with no build-time params, every path is rendered on demand
// and cached per `revalidate` (routes without generateStaticParams are forced dynamic).
export function generateStaticParams() {
    return [];
}

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
    return getEventPageMetadata(name, `/event/${name}`);
}

export default async function Page(props: Props) {
    const { name } = await props.params;
    const data = await getEventPageData(name);
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
