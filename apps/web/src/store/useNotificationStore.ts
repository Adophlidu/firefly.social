import type { NotificationSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';
import type { NotificationType } from '@/providers/types/SocialMedia.js';

type NotificationState = Record<
    NotificationSource,
    {
        types: NotificationType[];
        enableQualityFilter: boolean;
    }
> & {
    setEnableQualityFilter: (source: NotificationSource, enabled: boolean) => void;
    setTypes: (source: NotificationSource, types: NotificationType[]) => void;
};

const useNotificationStateBase = create<NotificationState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer((set, get) => ({
            [Source.Farcaster]: {
                types: [],
                enableQualityFilter: true,
            },
            [Source.Lens]: {
                types: [],
                enableQualityFilter: true,
            },
            [Source.Notifications]: {
                types: [],
                enableQualityFilter: true,
            },
            [Source.Bsky]: {
                types: [],
                enableQualityFilter: true,
            },
            [Source.Twitter]: {
                types: [],
                enableQualityFilter: true,
            },
            setTypes: (source, types) => {
                set((state) => {
                    state[source].types = types;
                });
            },
            setEnableQualityFilter: (source, enabled) => {
                set((state) => {
                    state[source].enableQualityFilter = enabled;
                });
            },
        })),
        {
            name: 'firefly-notification',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export const useNotificationStateStore = createSelectors(useNotificationStateBase);
