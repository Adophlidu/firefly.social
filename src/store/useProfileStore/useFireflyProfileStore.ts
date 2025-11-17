'use client';

import { bom } from '@dimensiondev/utils';

import { AsyncStatus, Source } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { createSelectors } from '@/helpers/createSelector.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { createProfileState, customSelectors } from '@/store/useProfileStore/createProfileState.js';

const state = createProfileState(
    {},
    {
        name: 'firefly-state',
        onRehydrateStorage: () => (state) => {
            if (!bom.window || !state) return;

            try {
                const session = state.currentProfileSession;

                if (session) {
                    fireflySessionHolder.resumeSession(session as FireflySession);

                    state.updateCurrentAccount({
                        profile: createDummyProfile(Source.Farcaster),
                        session,
                    });
                } else {
                    state.clear();
                }
            } catch (error) {
                state.__setStatus__(AsyncStatus.Idle);
                if (error instanceof FetchError) return;
                state.clear();
            }
        },
    },
);

export const useFireflyProfileStore = createSelectors(state, customSelectors);
