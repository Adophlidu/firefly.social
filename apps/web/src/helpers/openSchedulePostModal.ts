import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { SchedulePostModalOpenProps } from '@/modals/SchedulePostModal/refs.js';

export function openSchedulePostModal(props: SchedulePostModalOpenProps) {
    dispatchModalEvent('schedule-post-modal', 'open', props);
}
