'use client';

import { useAsync } from 'react-use';

import { ActivityMobileOnly } from '@/components/Activity/ActivityMobileOnly.js';
import { Loading } from '@/components/Loading.js';
import { IS_IOS } from '@/constants/browser.js';
import { dynamic } from '@/esm/dynamic.js';
import { waitForWebviewDidLoadEvent } from '@/helpers/waitForWebviewDidLoadEvent.js';
import type { ActivityInfoResponse } from '@/providers/types/Firefly.js';

const ActivityButtrflyTasks = dynamic(() =>
    import('@/components/Activity/ActivityTasks/ActivityButtrflyTasks.js').then((mod) => ({
        default: mod.ActivityButtrflyTasks,
    })),
);

const ActivityElex24Tasks = dynamic(() =>
    import('@/components/Activity/ActivityTasks/ActivityElex24Tasks.js').then((mod) => ({
        default: mod.ActivityElex24Tasks,
    })),
);

const ActivityFrensgivingTasks = dynamic(() =>
    import('@/components/Activity/ActivityTasks/ActivityFrensgivingTasks.js').then((mod) => ({
        default: mod.ActivityFrensgivingTasks,
    })),
);

const ActivityHaidilaoTask = dynamic(
    () =>
        import('@/components/Activity/ActivityTasks/ActivityHaidilaoTask.js').then((mod) => ({
            default: mod.ActivityHaidilaoTask,
        })),
    {
        ssr: false,
        loading: () => <Loading />,
    },
);

const ActivityCreatorTasks = dynamic(() =>
    import('@/components/Activity/ActivityTasks/ActivityCreatorTasks.js').then((mod) => ({
        default: mod.ActivityCreatorTasks,
    })),
);

const ActivityHlblTasks = dynamic(() =>
    import('@/components/Activity/ActivityTasks/ActivityHlblTasks.js').then((mod) => ({
        default: mod.ActivityHlblTasks,
    })),
);

const ActivityPenguTasks = dynamic(() =>
    import('@/components/Activity/ActivityTasks/ActivityPenguTasks.js').then((mod) => ({
        default: mod.ActivityPenguTasks,
    })),
);

const ActivitySocialFrensTasks = dynamic(() =>
    import('@/components/Activity/ActivityTasks/ActivitySocialFrensTasks.js').then((mod) => ({
        default: mod.ActivitySocialFrensTasks,
    })),
);

const ActivityTrumpTasks = dynamic(() =>
    import('@/components/Activity/ActivityTasks/ActivityTrumpTasks.js').then((mod) => ({
        default: mod.ActivityTrumpTasks,
    })),
);

interface Props {
    name: string;
    data: Required<ActivityInfoResponse>['data'];
}

export function ActivityTasks({ name, data }: Props) {
    const { value: isReady } = useAsync(async () => {
        try {
            // iOS needs to wait for the load event to be able to communicate with the bridge
            if (IS_IOS) {
                console.log('[ActivityTasks] wait for webview did load event');
                await waitForWebviewDidLoadEvent();
                return true;
            }
            return true;
        } catch (error) {
            console.error('[ActivityTasks] failed to wait for webview did load event', error);
            return true;
        }
    }, []);

    if (!isReady) return null;

    switch (name) {
        case 'hlbl':
            return <ActivityHlblTasks data={data} />;
        case 'elex24':
            return <ActivityElex24Tasks data={data} />;
        case 'frensgiving':
            return <ActivityFrensgivingTasks data={data} />;
        case 'pengu':
            return (
                <ActivityMobileOnly>
                    <ActivityPenguTasks data={data} />
                </ActivityMobileOnly>
            );
        case 'trump':
            return (
                <ActivityMobileOnly>
                    <ActivityTrumpTasks data={data} />
                </ActivityMobileOnly>
            );
        case 'buttrfly':
            return <ActivityButtrflyTasks data={data} />;
        case 'socialfrens':
            return <ActivitySocialFrensTasks data={data} />;
        case 'creator':
            return <ActivityCreatorTasks />;
        case 'haidilao':
            return <ActivityHaidilaoTask data={data} />;
        default:
            return null;
    }
}

export default ActivityTasks;
