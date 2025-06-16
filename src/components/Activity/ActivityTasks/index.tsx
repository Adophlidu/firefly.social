'use client';

import { ActivityElex24Provider } from '@/components/Activity/ActivityElex24/ActivityElex24Context.js';
import { ActivityMobileOnly } from '@/components/Activity/ActivityMobileOnly.js';
import { ActivityButtrflyTasks } from '@/components/Activity/ActivityTasks/ActivityButtrflyTasks.js';
import { ActivityElex24Tasks } from '@/components/Activity/ActivityTasks/ActivityElex24Tasks.js';
import { ActivityFrensgivingTasks } from '@/components/Activity/ActivityTasks/ActivityFrensgivingTasks.js';
import { ActivityHlblTasks } from '@/components/Activity/ActivityTasks/ActivityHlblTasks.js';
import { ActivityPenguTasks } from '@/components/Activity/ActivityTasks/ActivityPenguTasks.js';
import { ActivitySocialFrensTasks } from '@/components/Activity/ActivityTasks/ActivitySocialFrensTasks.js';
import { ActivityTrumpTasks } from '@/components/Activity/ActivityTasks/ActivityTrumpTasks.js';
import type { ActivityInfoResponse } from '@/providers/types/Firefly.js';

interface Props {
    name: string;
    data: Required<ActivityInfoResponse>['data'];
}

export function ActivityTasks({ name, data }: Props) {
    switch (name) {
        case 'hlbl':
            return <ActivityHlblTasks data={data} />;
        case 'elex24':
            return (
                <ActivityElex24Provider>
                    <ActivityElex24Tasks data={data} />
                </ActivityElex24Provider>
            );
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
        default:
            return null;
    }
}

export default ActivityTasks;
