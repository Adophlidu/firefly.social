import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';

interface ComposeScheduleState {
    // The time set for sending. if not present, means it's not a scheduled sending task.
    scheduleTime?: Date;
    disableSchedule: boolean;

    updateScheduleTime: (time: Date) => void;
    clearScheduleTime: () => void;
    resetScheduleState: () => void;
    updateDisableSchedule: (disable: boolean) => void;
}

const useComposeScheduleStoreBase = create<ComposeScheduleState, [['zustand/immer', never]]>(
    immer<ComposeScheduleState>((set) => ({
        disableSchedule: false,
        updateScheduleTime: (time) =>
            set((state) => {
                state.scheduleTime = time;
            }),
        clearScheduleTime: () =>
            set((state) => {
                state.scheduleTime = undefined;
            }),
        resetScheduleState: () =>
            set((state) => {
                state.scheduleTime = undefined;
                state.disableSchedule = false;
            }),
        updateDisableSchedule: (disable) =>
            set((state) => {
                state.disableSchedule = disable;
            }),
    })),
);

export const useComposeScheduleStateStore = createSelectors(useComposeScheduleStoreBase);
