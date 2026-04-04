import { EMPTY_LIST } from '@dimensiondev/constants';
import { compact, values } from 'lodash-es';
import { useAsyncFn } from 'react-use';

import { DraftPostType, type SocialSource } from '@/constants/enum.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { isEmptyPost } from '@/helpers/isEmptyPost.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { logger } from '@/libs/Logger.js';
import { saveLocalDraftToCloud } from '@/services/saveLocalDraftToCloud.js';
import { type Draft, useComposeDraftState } from '@/store/useComposeDraftStore.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export function useSaveDraftInCompose(draftType: DraftPostType.LocalNormal | DraftPostType.LocalTemp) {
    const { scheduleTime } = useComposeScheduleStateStore();
    const profilesAll = useCurrentProfilesAll();

    const { addDraft, removeTempDrafts } = useComposeDraftState();

    return useAsyncFn(async () => {
        try {
            const { posts, cursor, type, currentDraftId, sealedSource } = useComposeStateStore.getState();

            if (!posts.length || posts.every((x) => isEmptyPost(x))) return null;

            const compositePost = getCompositePost(cursor);
            const { availableSources = EMPTY_LIST } = compositePost ?? {};
            const errorsSource = [
                ...new Set(
                    posts.flatMap((x) => {
                        // Failed source obtained
                        return compact(Object.entries(x.postError).map(([key, value]) => (value ? key : undefined)));
                    }),
                ),
            ] as SocialSource[];
            const hasError = !!errorsSource.length;
            const sources = hasError ? errorsSource : availableSources;

            const draft: Draft = {
                draftId: currentDraftId || crypto.randomUUID(),
                createdAt: new Date(),
                cursor,
                posts: hasError ? posts.map((x) => ({ ...x, availableSources: sources })) : posts,
                type,
                availableProfiles: compact(values(profilesAll)).filter((x) => sources.includes(x.source)),
                scheduleTime,
                sealedSource,
                draftType,
            };
            addDraft(draft);

            if (draftType === DraftPostType.LocalNormal) {
                removeTempDrafts();
                saveLocalDraftToCloud(draft).catch((error) => {
                    logger.error('Failed to save draft to cloud', error);
                });
            }

            return draft;
        } catch (error) {
            logger.error('Failed to save draft in compose', error);
            return null;
        }
    }, [scheduleTime, profilesAll, draftType, addDraft, removeTempDrafts]);
}
