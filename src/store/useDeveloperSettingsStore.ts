import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { createSelectors } from '@/helpers/createSelector.js';

interface DeveloperSettingsState {
    developmentAPI: boolean;
    updateDevelopmentAPI: (value: boolean) => void;

    telemetry: boolean;
    updateTelemetry: (value: boolean) => void;

    telemetryDebug: boolean;
    updateTelemetryDebug: (value: boolean) => void;
}

const useDeveloperSettingsBase = create<
    DeveloperSettingsState,
    [['zustand/persist', unknown], ['zustand/immer', never]]
>(
    persist(
        immer((set) => ({
            developmentAPI: env.external.NEXT_PUBLIC_FIREFLY_DEV_API === STATUS.Enabled,
            updateDevelopmentAPI: (value: boolean) =>
                set((state) => {
                    state.developmentAPI = value;
                }),

            telemetry: env.external.NEXT_PUBLIC_TELEMETRY === STATUS.Enabled,
            updateTelemetry: (value: boolean) =>
                set((state) => {
                    state.telemetry = value;
                }),

            telemetryDebug: false,
            updateTelemetryDebug: (value: boolean) =>
                set((state) => {
                    state.telemetryDebug = value;
                }),
        })),
        {
            name: 'developer-settings',
            partialize: (state) => ({
                developmentAPI: state.developmentAPI,
                telemetry: state.telemetry,
                telemetryDebug: state.telemetryDebug,
            }),
        },
    ),
);

export const useDeveloperSettingsState = createSelectors(useDeveloperSettingsBase);
