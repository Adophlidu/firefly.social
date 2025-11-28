import { type Draft as WritableDraft, produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { SocialSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { createPersistStorage } from '@/helpers/createPersistStorage.js';
import { createSelectors } from '@/helpers/createSelector.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import type { ComposeType, CompositePost, MediaObject } from '@/types/compose.js';

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
}

interface ComposeDraftState {
    drafts: Draft[];
    addDraft: (draft: Draft) => void;
    removeDraft: (id: string) => void;
}

const useComposeStateBase = create<ComposeDraftState, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer<ComposeDraftState>((set) => ({
            drafts: EMPTY_LIST,
            addDraft: (draft: Draft) =>
                set((state) => {
                    const index = state.drafts.findIndex((x) => x.draftId === draft.draftId);
                    if (index === -1) {
                        state.drafts = [...state.drafts, draft] as Array<WritableDraft<Draft>>;
                    } else {
                        state.drafts = [
                            ...state.drafts.slice(0, index),
                            draft,
                            ...state.drafts.slice(index + 1),
                        ] as Array<WritableDraft<Draft>>;
                    }
                }),
            removeDraft: (draftId: string) => {
                set((state) => {
                    state.drafts = state.drafts.filter((x) => x.draftId !== draftId);
                });
            },
        })),
        {
            storage: createPersistStorage<{ drafts: Draft[] }>('firefly-compose-state'),
            partialize: (state) => ({ drafts: state.drafts }),
            name: 'firefly-compose-state',
            version: 1,
            migrate(persistedState, version) {
                if (!persistedState) return { drafts: [] };
                // TODO Introduced in 2025/08/27, should be removed in 3 months after 2025/08/27
                if (version === 0 && 'drafts' in (persistedState as any)) {
                    return produce(persistedState as { drafts: Draft[] }, (state) => {
                        state.drafts.forEach((draft) => {
                            draft.posts.forEach((post) => {
                                if (!post.videos) post.videos = [];

                                if ('video' in post && post.video) {
                                    post.videos = [post.video as MediaObject];
                                }
                            });
                        });
                    });
                }
                return persistedState as { drafts: Draft[] };
            },
        },
    ),
);

export const useComposeDraftStateStore = createSelectors(useComposeStateBase);
