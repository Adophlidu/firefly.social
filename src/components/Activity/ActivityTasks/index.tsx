import { ActivityCreatorTasks } from '@/components/Activity/ActivityTasks/ActivityCreatorTasks.js';
import type { ActivityInfoResponse } from '@/providers/types/Firefly.js';

export function ActivityTasks({ name }: { name: string; data: ActivityInfoResponse['data'] }) {
    switch (name) {
        case 'creator':
            return <ActivityCreatorTasks />;
        default:
            return null;
    }
}

export default ActivityTasks;
