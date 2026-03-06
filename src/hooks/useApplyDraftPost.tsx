import { Trans } from '@lingui/react/macro';
import { compact, first, values } from 'lodash-es';
import { useAsyncFn } from 'react-use';

import { DraftPostType, type SocialSource } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { isEmptyPost } from '@/helpers/isEmptyPost.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';
import { useSetEditorContent } from '@/hooks/useSetEditorContent.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { type Draft, useComposeDraftState } from '@/store/useComposeDraftStore.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { createInitPostState, useComposeStateStore } from '@/store/useComposeStore.js';
import { MediaSource } from '@/types/compose.js';

export function useApplyDraftPost() {
    const profiles = useCurrentProfiles();

    const { updateChars, apply, focused } = useComposeStateStore();
    const { updateScheduleTime } = useComposeScheduleStateStore();
    const setEditorContent = useSetEditorContent();

    return useAsyncFn(
        async (oldDraft: Draft, full = false) => {
            const draft = { ...oldDraft };

            try {
                if (draft.type === 'reply' || draft.type === 'quote') {
                    const target = first(draft.posts);
                    const post = first(compact(values(target?.parentPost)));
                    if (!target || !post) {
                        enqueueErrorMessage(<Trans>The post you quoted/replied not found</Trans>);
                        return;
                    }

                    const provider = resolveSocialMediaProvider(post.source);
                    const detail = await runInSafeAsync(() => provider.getPostById(post.postId));
                    if (!detail) {
                        enqueueErrorMessage(<Trans>The post you quoted/replied not found</Trans>);
                        return;
                    }
                    if (detail.isHidden) {
                        enqueueErrorMessage(<Trans>The post you quoted/replied has already deleted</Trans>);
                        return;
                    }

                    target.parentPost[post.source] = detail;
                }

                const availableProfiles = draft.availableProfiles.filter((x) =>
                    profiles.some((profile) => isSameProfile(profile, x)),
                );
                const availableSource =
                    draft.type !== 'compose' ? draft.sealedSource || first(draft.posts)?.availableSources?.[0] : null;
                apply({
                    ...draft,
                    focused,
                    sealedSource: availableSource || null,
                    posts: draft.posts.map((x) => ({
                        ...x,
                        ...(full
                            ? {
                                  postId: createInitPostState(),
                                  postError: createInitPostState(),
                                  parentPost: createInitPostState(),
                              }
                            : {}),
                        availableSources: availableProfiles.map((x) => x.source as SocialSource),
                        images: x.images.map((image) => ({
                            ...image,
                            urls: {
                                ...image.urls,
                                [MediaSource.Local]: URL.createObjectURL(image.file),
                            },
                        })),
                    })),
                    currentDraftId: draft.draftId,
                    showMediaAlert: draft.draftType === DraftPostType.Cloud && !!draft.mediaAlert,
                });
                const post = draft.posts.find((x) => x.id === draft.cursor);
                if (post) {
                    updateChars(post.chars, post.id);
                    setEditorContent(post.chars);
                }
                if (draft.scheduleTime && draft.scheduleTime.getTime() > Date.now())
                    updateScheduleTime(draft.scheduleTime);
            } catch (error) {
                enqueueErrorMessage(<Trans>Failed to apply draft post.</Trans>);
                throw error;
            }
        },
        [profiles, focused, setEditorContent, updateChars, updateScheduleTime, apply],
    );
}

export function useApplyTempDraftPost() {
    const isSmall = useIsSmall('max');
    const profiles = useCurrentProfiles();
    const { posts } = useComposeStateStore();
    const { drafts, removeTempDrafts } = useComposeDraftState();
    const [, applyDraftPost] = useApplyDraftPost();

    return useAsyncFn(async () => {
        if (posts.some((x) => !isEmptyPost(x))) return;

        const tempDraft = drafts.find((draft) => draft.draftType === DraftPostType.LocalTemp);
        if (!tempDraft) return;

        const isDisabled = !tempDraft.availableProfiles.some((x) =>
            profiles.some((profile) => isSameProfile(profile, x)),
        );
        if (isDisabled) return;

        const confirmed = await ConfirmModalRef.openAndWaitForClose({
            title: <Trans>Unsaved draft found</Trans>,
            content: (
                <div className="text-medium text-main md:text-base">
                    <Trans>Would you like to restore it?</Trans>
                </div>
            ),
            enableCloseButton: !isSmall,
            enableCancelButton: true,
            cancelButtonText: <Trans>Discard</Trans>,
            confirmButtonText: <Trans>Yes</Trans>,
            variant: 'normal',
        });
        if (confirmed === null) return;
        if (confirmed === false) {
            removeTempDrafts();
            return;
        }

        await applyDraftPost(tempDraft, true);
    }, [drafts, isSmall, profiles, posts, applyDraftPost, removeTempDrafts]);
}
