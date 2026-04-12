import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { ScheduleTask } from '@/providers/types/Firefly.js';

export interface SchedulePostModalOpenProps {
    action: 'create' | 'update';
    task?: ScheduleTask;
}

export type SchedulePostModalRefType = SingletonModalRefCreator<SchedulePostModalOpenProps>;

export const SchedulePostModalRef = new SingletonModal<SchedulePostModalOpenProps>();
