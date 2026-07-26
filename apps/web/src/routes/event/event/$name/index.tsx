import { ActivityStatus } from '@dimensiondev/enums';
import { type HeadContext, type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { ActivityHeader } from '@/components/Activity/ActivityHeader.js';
import { dynamic } from '@/esm/dynamic.js';
import { getEventPageData } from '@/providers/firefly/metadata/getEventPageData.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageMetadata.js';

export const config = { cache: { sMaxAge: 300 } };

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

interface EventLoaderData {
    data: NonNullable<Awaited<ReturnType<typeof getEventPageData>>>;
    name: string;
}

export async function loader({ params }: LoaderContext): Promise<EventLoaderData> {
    const data = await getEventPageData(params.name!);
    if (!data) notFound();
    return { data, name: params.name! };
}

export async function head({ params }: HeadContext) {
    return fromNextMetadata(await getEventPageMetadata(params.name ?? '', `/event/${params.name}`));
}

export default function EventNamePage() {
    const { data, name } = useLoaderData<EventLoaderData>();
    return (
        <div className="flex min-h-svh w-full flex-1 flex-col">
            <ActivityNavigationBar>{data.title}</ActivityNavigationBar>
            <ActivityHeader data={data} />
            <ActivityTasks data={data} name={name} />
            {data.status === ActivityStatus.Ended ? <ActivityEndedDialog data={data} /> : null}
        </div>
    );
}
