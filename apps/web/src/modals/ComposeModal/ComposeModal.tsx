'use client';

import type { SocialSource } from '@dimensiondev/enums';
import { CharTag, DraftPostType } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { delay } from '@dimensiondev/utils';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer.js';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { Trans } from '@lingui/react/macro';
import { RouterProvider } from '@tanstack/react-router';
import { $getRoot } from 'lexical';
import { compact } from 'lodash-es';
import { type Ref, useCallback, useRef } from 'react';
import { useUpdateEffect } from 'react-use';
import urlcat from 'urlcat';

import { router } from '@/components/Compose/ComposeRouter.js';
import { MentionNode } from '@/components/Lexical/nodes/MentionsNode.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { closeComposeModal } from '@/controllers/openComposeModal.js';
import { openAndWaitForCloseConfirmModal } from '@/controllers/openConfirmModal.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { isEmptyPost } from '@/helpers/isEmptyPost.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { useApplyTempDraftPost } from '@/hooks/useApplyDraftPost.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';
import { useSaveDraftInCompose } from '@/hooks/useSaveDraftInCompose.js';
import { useSetEditorContent } from '@/hooks/useSetEditorContent.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ComposeModalContext } from '@/modals/ComposeModal/context.js';
import { CloseAction } from '@/modals/ComposeModal/refs.js';
import type { ComposeModalCloseProps, ComposeModalOpenProps } from '@/modals/ComposeModal/types.js';
import { captureComposeDraftPostEvent } from '@/providers/telemetry/captureComposeEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useComposeDraftState } from '@/store/useComposeDraftStore.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import type { Chars } from '@/types/chars.js';

export { CloseAction, ComposeModalRef } from '@/modals/ComposeModal/refs.js';

const initialConfig = {
    namespace: 'composer',
    theme: {
        link: 'text-highlight',
        hashtag: 'text-highlight',
        mention: 'text-highlight',
    },
    nodes: [MentionNode, HashtagNode, AutoLinkNode, LinkNode],
    editorState: null,
    onError: () => {},
};

interface Props {
    ref: Ref<SingletonModalRefCreator<ComposeModalOpenProps, ComposeModalCloseProps>>;
}

function ComposeModalUI({ ref }: Props) {
    const contentRef = useRef<HTMLDivElement>(null);
    const controller = useAbortController();

    const {
        posts,
        isBusy,
        cursor,
        type,
        addUrl,
        addImage,
        updateType,
        updateAvailableSources,
        updateParentPost,
        updateChars,
        updateChannel,
        toggleAnonymous,
        updateSealedSource,
        clear,
        updateIsFailedSchedulePost,
        updateDisabledSources,
        updateLpt1Tags,
        updateLpt1Attributes,
        updateLockThread,
    } = useComposeStateStore();
    const { clearScheduleTime, resetScheduleState, updateDisableSchedule } = useComposeScheduleStateStore();
    const [, applyTempDraftPost] = useApplyTempDraftPost();
    const { removeTempDrafts } = useComposeDraftState();
    const { updateFireflyWalletIsOpen } = useGlobalState();

    const [editor] = useLexicalComposerContext();

    const setEditorContent = useSetEditorContent();
    const [open, dispatch] = useSingletonModal(ref, {
        name: 'compose-modal',
        onOpen: ({
            type,
            source,
            post,
            chars,
            channel,
            embeds,
            images,
            initialPath,
            isFailedSchedulePost,
            isAnonymous,
            disabledSources,
            disableSchedule,
            lpt1Tags,
            lpt1Attributes,
            lockThread,
        }) => {
            // Close firefly wallet when compose modal opens
            updateFireflyWalletIsOpen(false);

            controller.current.abort();
            const newType = type || 'compose';

            updateType(newType);
            updateAvailableSources(source ? (Array.isArray(source) ? source : [source]) : getCurrentAvailableSources());
            if (post) updateParentPost(post.source, post);
            if (post && newType !== 'compose') updateSealedSource(post.source);
            if (chars) {
                updateChars(chars);
                setEditorContent(chars);
            }
            if (disabledSources && disabledSources.length > 0) updateDisabledSources(disabledSources);
            if (channel) updateChannel(channel);
            if (isAnonymous) toggleAnonymous(true);
            if (lpt1Tags) updateLpt1Tags(lpt1Tags);
            if (lpt1Attributes) updateLpt1Attributes(lpt1Attributes);
            if (lockThread) updateLockThread(true);
            if (initialPath) router.navigate({ to: initialPath });
            embeds?.forEach((embedUrl) => addUrl(embedUrl));
            images?.forEach((image, index) => addImage(image, index));
            if (isFailedSchedulePost) updateIsFailedSchedulePost(true);
            if (disableSchedule) {
                clearScheduleTime();
                updateDisableSchedule(true);
            }

            // Orb comments (lockThread) are ephemeral — skip the "Unsaved draft
            // found?" restore prompt. Auto-save + save-on-close are preserved (FW-7894).
            if (!lockThread) {
                setTimeout(() => {
                    applyTempDraftPost(newType, post || undefined);
                }, 500); // wait for modal animation
            }
        },
        onClose: async (_props) => {
            // wait for animation to finish
            await delay(300);

            clear();
            resetScheduleState();
            router.navigate({ to: '/' });

            controller.current.renew();

            // https://github.com/DimensionDev/firefly.social/pull/1644
            await delay(1000);

            if (!controller.current.signal?.aborted) editor.update(() => $getRoot().clear());
        },
    });

    const isSmall = useIsSmall('max');

    const [_, saveDraftInCompose] = useSaveDraftInCompose(DraftPostType.LocalNormal);

    const onClose = useCallback(async () => {
        const compositePost = getCompositePost(cursor);
        const { isAnonymous } = compositePost ?? {};
        if (posts.some((x) => !isEmptyPost(x))) {
            const errorsSource = [
                ...new Set(
                    posts.flatMap((x) => {
                        // Failed source obtained
                        return compact(Object.entries(x.postError).map(([key, value]) => (value ? key : undefined)));
                    }),
                ),
            ] as SocialSource[];

            const hasError = !!errorsSource.length;
            const confirmed = await openAndWaitForCloseConfirmModal({
                title: isAnonymous ? (
                    <Trans>Discard Post</Trans>
                ) : hasError ? (
                    <Trans>Save failed post?</Trans>
                ) : (
                    <Trans>Save Post?</Trans>
                ),
                content: (
                    <div className="text-medium text-main md:text-base">
                        {isAnonymous ? (
                            <Trans>Content will be lost when leaving this page in anonymous mode.</Trans>
                        ) : hasError ? (
                            <Trans>You can save the failed parts of posts and send them later from your Drafts.</Trans>
                        ) : (
                            <Trans>You can save this to send later from your drafts.</Trans>
                        )}
                    </div>
                ),
                enableCloseButton: !isSmall,
                enableCancelButton: true,
                cancelButtonText: <Trans>Discard</Trans>,
                confirmButtonText: isAnonymous ? <Trans>Cancel</Trans> : <Trans>Save</Trans>,
                variant: 'normal',
            });
            if (confirmed === null || (confirmed && isAnonymous)) return CloseAction.None;

            if (confirmed) {
                const draft = await saveDraftInCompose();
                if (!draft) {
                    dispatch?.close();
                    return;
                }
                closeComposeModal();
                enqueueSuccessMessage(<Trans>Your draft was saved.</Trans>);
                captureComposeDraftPostEvent(EventId.COMPOSE_DRAFT_CREATE_SUCCESS, posts[0], {
                    draftId: draft.draftId,
                    thread: posts,
                });
                return CloseAction.Saved;
            } else {
                // Close first so the modal animates out with the content still showing.
                // The modal stays mounted for the leave transition (~200ms, see Modal.tsx),
                // so clearing state right away would re-render it empty while still visible.
                dispatch?.close();
                await delay(300);

                // Reset the whole compose state (chars + images + videos) together.
                // Clearing only the editor leaves images in the store, and the debounced
                // editor onChange later writes back empty chars — the auto-save subscription
                // then sees "empty text + images", treats the post as non-empty, and
                // resurrects the temp draft we just removed. See FW-7809.
                clear();
                editor.update(() => $getRoot().clear());
                removeTempDrafts();
            }
        } else {
            dispatch?.close();
        }
        return CloseAction.Discard;
    }, [isSmall, dispatch, posts, cursor, saveDraftInCompose, removeTempDrafts, clear]);

    useUpdateEffect(() => {
        if (type !== 'quote') return;
        const compositePost = getCompositePost(cursor);
        if (!compositePost) return;
        const parentPost = Object.values(compositePost.parentPost).find((x) => x);
        if (!parentPost) return;
        const chars: Chars = [
            ...compositePost.chars,
            {
                tag: CharTag.POST_LINK,
                content: urlcat(SITE_URL, resolvePostUrl(parentPost.source, parentPost.postId)),
                source: parentPost.source,
                visible: false,
                sortNo: 15,
            },
        ];
        updateChars(chars);
        setEditorContent(chars);
    }, [type]);

    useUpdateEffect(() => {
        if (!contentRef.current || !posts.length) return;
        contentRef.current.scrollTop = contentRef.current?.scrollHeight;
    }, [posts.length]);

    return (
        <Modal open={open} onClose={onClose} dialogPanelClassName="flex-col" disableDialogClose>
            <div className="relative flex h-screen w-screen flex-col overflow-auto bg-lightBottom transition-all dark:bg-darkBottom dark:text-gray-950 md:h-auto md:w-[600px] md:flex-[0] md:overflow-visible md:rounded-xl lg:grow-0">
                {/* Loading */}
                {isBusy ? (
                    <div className="absolute inset-0 z-50 flex items-center justify-center">
                        <LoadingIcon />
                    </div>
                ) : null}

                <ComposeModalContext.Provider value={{ onClose }}>
                    <RouterProvider router={router} context={{ onClose }} />
                </ComposeModalContext.Provider>
            </div>
        </Modal>
    );
}

export function ComposeModal({ ref, ...props }: Props) {
    return (
        <LexicalComposer initialConfig={initialConfig}>
            <ComposeModalUI {...props} ref={ref} />
        </LexicalComposer>
    );
}
