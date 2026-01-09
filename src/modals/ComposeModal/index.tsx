'use client';

import { delay } from '@dimensiondev/utils';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer.js';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { Trans } from '@lingui/react/macro';
import { RouterProvider } from '@tanstack/react-router';
import { $getRoot } from 'lexical';
import { compact, values } from 'lodash-es';
import { useCallback, useRef } from 'react';
import { useUpdateEffect } from 'react-use';
import urlcat from 'urlcat';

import { router } from '@/components/Compose/ComposeRouter.js';
import { MentionNode } from '@/components/Lexical/nodes/MentionsNode.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { CharTag, type SocialSource } from '@/constants/enum.js';
import { EMPTY_LIST, SITE_URL } from '@/constants/static.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { isEmptyPost } from '@/helpers/isEmptyPost.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';
import { useSetEditorContent } from '@/hooks/useSetEditorContent.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type ComposeModalCloseProps, type ComposeModalOpenProps } from '@/modals/ComposeModal/types.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { captureComposeDraftPostEvent } from '@/providers/telemetry/captureComposeEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useComposeDraftStateStore } from '@/store/useComposeDraftStore.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { type Chars } from '@/types/chars.js';

export enum CloseAction {
    Saved = 'saved',
    Discard = 'discard',
    None = 'none',
}

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
    ref: React.Ref<SingletonModalRefCreator<ComposeModalOpenProps, ComposeModalCloseProps>>;
}

function ComposeModalUI({ ref }: Props) {
    const contentRef = useRef<HTMLDivElement>(null);
    const controller = useAbortController();

    const profilesAll = useCurrentProfilesAll();

    const {
        posts,
        addUrl,
        type,
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
        isBusy,
        cursor,
        currentDraftId,
        sealedSource,
    } = useComposeStateStore();
    const { clearScheduleTime, scheduleTime } = useComposeScheduleStateStore();

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
            initialPath,
            isFailedSchedulePost,
            isAnonymous,
            disabledSources,
        }) => {
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
            if (initialPath) router.navigate({ to: initialPath });
            embeds?.forEach((embedUrl) => addUrl(embedUrl));
            if (isFailedSchedulePost) updateIsFailedSchedulePost(true);
        },
        onClose: async (_props) => {
            // wait for animation to finish
            await delay(300);

            clear();
            clearScheduleTime();
            router.navigate({ to: '/' });

            controller.current.renew();

            // https://github.com/DimensionDev/firefly.social/pull/1644
            await delay(1000);

            if (!controller.current.signal?.aborted) editor.update(() => $getRoot().clear());
        },
    });

    const isSmall = useIsSmall('max');

    const { addDraft } = useComposeDraftStateStore();

    const onClose = useCallback(async () => {
        const compositePost = getCompositePost(cursor);
        const { availableSources = EMPTY_LIST, isAnonymous } = compositePost ?? {};
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

            const sources = hasError ? errorsSource : availableSources;
            const confirmed = await ConfirmModalRef.openAndWaitForClose({
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
                const draft = {
                    draftId: currentDraftId || crypto.randomUUID(),
                    createdAt: new Date(),
                    cursor,
                    posts: hasError ? posts.map((x) => ({ ...x, availableSources: sources })) : posts,
                    type,
                    availableProfiles: compact(values(profilesAll)).filter((x) => sources.includes(x.source)),
                    scheduleTime,
                    sealedSource,
                };

                addDraft(draft);
                ComposeModalRef.close();
                enqueueSuccessMessage(<Trans>Your draft was saved.</Trans>);
                captureComposeDraftPostEvent(EventId.COMPOSE_DRAFT_CREATE_SUCCESS, posts[0], {
                    draftId: draft.draftId,
                    thread: posts,
                });
                return CloseAction.Saved;
            } else {
                dispatch?.close();
            }
        } else {
            dispatch?.close();
        }
        return CloseAction.Discard;
    }, [isSmall, profilesAll, dispatch, addDraft, posts, cursor, currentDraftId, type, sealedSource, scheduleTime]);

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
        <Modal
            open={open}
            onClose={onClose}
            dialogPanelClassName="flex-col"
            disableScrollLock={false}
            disableDialogClose
        >
            <div className="relative flex h-screen w-screen flex-col overflow-auto bg-lightBottom transition-all dark:bg-darkBottom dark:text-gray-950 md:h-auto md:w-[600px] md:flex-[0] md:rounded-xl lg:grow-0">
                {/* Loading */}
                {isBusy ? (
                    <div className="absolute inset-0 z-50 flex items-center justify-center">
                        <LoadingIcon />
                    </div>
                ) : null}

                <RouterProvider router={router} context={{ onClose }} />
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

export const ComposeModalRef = new SingletonModal<ComposeModalOpenProps, ComposeModalCloseProps>();
