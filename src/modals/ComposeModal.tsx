'use client';

import { delay } from '@dimensiondev/utils';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer.js';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { RouterProvider } from '@tanstack/react-router';
import { $getRoot } from 'lexical';
import { compact, values } from 'lodash-es';
import { useCallback, useMemo, useRef } from 'react';
import { useAsync, useUpdateEffect } from 'react-use';
import urlcat from 'urlcat';

import { router } from '@/components/Compose/ComposeRouter.js';
import { MentionNode } from '@/components/Lexical/nodes/MentionsNode.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { CharTag, FileMimeType, type SocialSource } from '@/constants/enum.js';
import { EMPTY_LIST, RP_HASH_TAG, SITE_URL, SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { fetchImageAsPNG } from '@/helpers/fetchImageAsPNG.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isEmptyPost } from '@/helpers/isEmptyPost.js';
import { createLocalMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';
import { useSetEditorContent } from '@/hooks/useSetEditorContent.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { createCover } from '@/providers/firefly/red-packet/createCover.js';
import { captureComposeDraftPostEvent } from '@/providers/telemetry/captureComposeEvent.js';
import type { Channel, Post } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useComposeDraftStateStore } from '@/store/useComposeDraftStore.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { type CompositePost, useComposeStateStore } from '@/store/useComposeStore.js';
import { type Chars } from '@/types/chars.js';
import type { ComposeType } from '@/types/compose.js';
import type { RedPacketMetadata } from '@/types/rp.js';

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

export interface ComposeModalOpenProps {
    type?: ComposeType;
    chars?: Chars;
    embeds?: string[];
    source?: SocialSource | SocialSource[];
    post?: Post | null;
    channel?: Channel | null;
    initialPath?: string;
    isFailedSchedulePost?: boolean;
    isAnonymous?: boolean;
    disabledSources?: SocialSource[];
}

export enum CloseAction {
    Saved = 'saved',
    Discard = 'discard',
    None = 'none',
}

export type ComposeModalCloseProps = {
    post?: CompositePost;
} | void;

type Props = {
    ref: React.Ref<SingletonModalRefCreator<ComposeModalOpenProps, ComposeModalCloseProps>>;
};

function ComposeModalUI({ ref }: Props) {
    const contentRef = useRef<HTMLDivElement>(null);
    const controller = useAbortController();

    const profilesAll = useCurrentProfilesAll();

    const {
        posts,
        addUrl,
        addImage,
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
    } = useComposeStateStore();
    const { clearScheduleTime } = useComposeScheduleStateStore();
    const { rpPayload, availableSources } = useCompositePost();

    const [editor] = useLexicalComposerContext();

    const setEditorContent = useSetEditorContent();
    const [open, dispatch] = useSingletonModal(ref, {
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

    const onClose = useCallback(async () => {
        const { addDraft } = useComposeDraftStateStore.getState();
        const { posts, cursor, currentDraftId, type, sealedSource } = useComposeStateStore.getState();
        const { scheduleTime } = useComposeScheduleStateStore.getState();
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
    }, [isSmall, profilesAll, dispatch]);

    const promoteLink = useMemo(() => {
        const preferSource = SORTED_SOCIAL_SOURCES.find((x) => availableSources.includes(x) && profilesAll[x]);
        if (!preferSource) return SITE_URL;
        const preferProfile = profilesAll[preferSource]!;
        return urlcat(location.origin, getProfileUrl(preferProfile));
    }, [profilesAll, availableSources]);

    // Avoid recreating post content for red packet
    const { loading: encryptRedPacketProcessing } = useAsync(async () => {
        const { cursor } = useComposeStateStore.getState();
        const compositePost = getCompositePost(cursor);
        if (!rpPayload) return;
        const firstChar = compositePost?.chars[0];
        if (firstChar && typeof firstChar !== 'string' && 'tag' in firstChar && firstChar.tag === CharTag.FIREFLY_RP)
            return;

        try {
            const result = await createCover(rpPayload.metadata as RedPacketMetadata);
            if (!result.coverImageUrl) {
                throw new Error('Failed to create red packet cover.');
            }
            const coverBlob = await fetchImageAsPNG(result.coverImageUrl, true);

            const chars: Chars = [
                {
                    tag: CharTag.FIREFLY_RP,
                    content: RP_HASH_TAG,
                    visible: false,
                },
                ...(compositePost ? compositePost.chars : []),
                t`Check out my LuckyDrop 🧧💰✨ on Firefly mobile app or desktop!`,
                {
                    tag: CharTag.PROMOTE_LINK,
                    content: promoteLink,
                    visible: false,
                    sortNo: 5,
                },
            ];

            updateChars(chars);
            setEditorContent(chars);
            addImage(createLocalMediaObject(new File([coverBlob], 'image.png', { type: FileMimeType.PNG }), true), 0);
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to create image payload.</Trans>);
            throw error;
        }
    }, [rpPayload, promoteLink, updateChars, setEditorContent, addImage]);

    useUpdateEffect(() => {
        if (type !== 'quote') return;
        const { cursor } = useComposeStateStore.getState();
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
                {encryptRedPacketProcessing ? (
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
