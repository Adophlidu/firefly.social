import { ActivityCreatorTasks } from '@/components/Activity/ActivityTasks/ActivityCreatorTasks.js';
import { type ActivityInfoResponse } from '@/providers/types/Firefly.js';

export function ActivityTasks({ name }: { name: string; data: ActivityInfoResponse['data'] }) {
    if (name === 'creator') return <ActivityCreatorTasks />;
    return null;
}
