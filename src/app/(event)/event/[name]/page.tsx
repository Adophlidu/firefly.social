import { ActivityHeader } from '@/components/Activity/ActivityHeader.js';
import { dynamic } from '@/esm/dynamic.js';
import { notFound } from '@/esm/navigation.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyActivityProvider } from '@/providers/firefly/Activity.js';
import { ActivityStatus } from '@/providers/types/Firefly.js';
import type { NextPageProps } from '@/types/utility.js';

const ActivityNavigationBar = dynamic(() => import('@/components/Activity/ActivityNavigationBar.js'), { ssr: false });
const ActivityTasks = dynamic(() => import('@/components/Activity/ActivityTasks/index.js'), { ssr: false });
const ActivityEndedDialog = dynamic(() => import('@/components/Activity/ActivityEndedDialog.js'), { ssr: false });

interface Props extends NextPageProps<{ name: string }> {}

export default async function Page(props: Props) {
    const { name } = await props.params;
    const data = await runInSafeAsync(() => FireflyActivityProvider.getFireflyActivityInfo(name));
    if (!data) notFound();

    return (
        <div className="flex min-h-[100svh] w-full flex-1 flex-col">
            <ActivityNavigationBar>{data.title}</ActivityNavigationBar>
            <ActivityHeader data={data} />
            <ActivityTasks data={data} name={name} />
            {data.status === ActivityStatus.Ended ? <ActivityEndedDialog data={data} /> : null}
        </div>
    );
}
