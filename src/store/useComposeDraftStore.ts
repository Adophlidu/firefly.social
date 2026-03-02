import { type Draft as WritableDraft } from 'immer';
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { DraftPostType, type SocialSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { createPersistStorage } from '@/helpers/createPersistStorage.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { type ComposeType, type CompositePost } from '@/types/compose.js';

export interface Draft {
    draftId: string;
    createdAt: Date;
    availableProfiles: Profile[];
    scheduleTime?: Date;
    type: ComposeType;
    posts: CompositePost[];
    // tracking the currently editing post
    cursor: string;
    sealedSource?: SocialSource | null;
    // the fid when creating a draft.
    createBy?: string;
    draftType?: DraftPostType;
}

interface ComposeDraftState {
    drafts: Draft[];
    getDrafts: (accountId?: string | null) => Draft[];
    addDraft: (draft: Draft) => void;
    removeDraft: (id: string) => void;
    removeTempDrafts: () => void;
}

const getCurrentAccountId = () => fireflySessionHolder.session?.profileId;

const useComposeStateBase = create<ComposeDraftState, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer<ComposeDraftState>((set, get) => ({
            drafts: EMPTY_LIST,
            getDrafts: () => {
                const key = getCurrentAccountId();
                return get().drafts.filter((draft) => !draft.createBy || draft.createBy === key);
            },
            addDraft: (draft: Draft) =>
                set((state) => {
                    const newDraft = draft.createBy ? draft : { ...draft, createBy: getCurrentAccountId() };
                    const index = state.drafts.findIndex((x) =>
                        newDraft.draftType === DraftPostType.LocalTemp
                            ? x.draftType === DraftPostType.LocalTemp
                            : x.draftId === newDraft.draftId,
                    );
                    if (index === -1) {
                        state.drafts = [...state.drafts, newDraft] as Array<WritableDraft<Draft>>;
                    } else {
                        state.drafts = [
                            ...state.drafts.slice(0, index),
                            newDraft,
                            ...state.drafts.slice(index + 1),
                        ] as Array<WritableDraft<Draft>>;
                    }
                }),
            removeDraft: (draftId: string) => {
                set((state) => {
                    state.drafts = state.drafts.filter((x) => x.draftId !== draftId);
                });
            },
            removeTempDrafts: () => {
                set((state) => {
                    state.drafts = state.drafts.filter((x) => x.draftType !== DraftPostType.LocalTemp);
                });
            },
        })),
        {
            storage: createPersistStorage<{ drafts: Draft[] }>('firefly-compose-state'),
            partialize: (state) => ({ drafts: state.drafts }),
            name: 'firefly-compose-state',
            version: 1,
            migrate(persistedState, version) {
                if (!persistedState) return { drafts: EMPTY_LIST };
                return persistedState as { drafts: Draft[] };
            },
        },
    ),
);

export const useComposeDraftStateStore = createSelectors(useComposeStateBase);

export function useComposeDraftState() {
    const { drafts, removeDraft, getDrafts, removeTempDrafts, addDraft } = useComposeDraftStateStore();

    const result = useMemo(() => getDrafts(), [drafts]);

    return {
        drafts: result,
        addDraft,
        removeDraft,
        removeTempDrafts,
    };
}
