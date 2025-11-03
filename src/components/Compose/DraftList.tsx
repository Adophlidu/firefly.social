import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { compact, first, orderBy, values } from 'lodash-es';
import { memo, useCallback, useMemo } from 'react';

import Trash from '@/assets/trash2.svg';
import { Link } from '@/components/Link.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import type { SocialSource } from '@/constants/enum.js';
import { readChars } from '@/helpers/chars.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { useSetEditorContent } from '@/hooks/useSetEditorContent.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { captureDraftDeleteClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { type Draft, useComposeDraftStateStore } from '@/store/useComposeDraftStore.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { createInitPostState, useComposeStateStore } from '@/store/useComposeStore.js';
import { MediaSource } from '@/types/compose.js';

interface DraftListItemProps {
    draft: Draft;
    handleRemove: (cursor: string) => Promise<void>;
    handleApply: (draft: Draft, full?: boolean) => void;
}

const DraftListItem = memo<DraftListItemProps>(function DraftListItem({ draft, handleRemove, handleApply }) {
    const profiles = useCurrentProfiles();
    const hasError = draft.posts.some((x) => !!compact(values(x.postError)).length);

    const title = useMemo(() => {
        const target = first(draft.posts);
        const parent = target?.parentPost;
        const post = parent?.Farcaster || parent?.Lens;
        switch (draft.type) {
            case 'compose':
                if (draft.posts.length > 1)
                    return hasError ? <Trans>FAILED THREAD POST</Trans> : <Trans>THREAD POST</Trans>;
                return hasError ? <Trans>FAILED POST</Trans> : <Trans>POST</Trans>;
            case 'reply':
                const profileUrl = post ? getProfileUrl(post.author) : '';

                return (
                    <Trans>
                        REPLY to
                        <span className="ml-1">
                            <Link href={profileUrl}>@{post?.author.handle}</Link>
                        </span>
                    </Trans>
                );
            case 'quote':
                return <Trans>QUOTE</Trans>;
        }
    }, [draft, hasError]);

    const post = first(draft.posts);
    const content = post ? readChars(post.chars, 'visible') : '';

    const isDisabled = useMemo(() => {
        return !draft.availableProfiles.some((x) => profiles.some((profile) => isSameProfile(profile, x)));
    }, [profiles, draft.availableProfiles]);

    return (
        <div className="border-b border-line py-3 last:border-b-0">
            <div className="flex items-center justify-between">
                <div
                    className={classNames('text-[12px] font-bold', {
                        'text-danger': hasError,
                        'text-secondary': !hasError,
                    })}
                >
                    {title}
                </div>
                <Trash className="size-5 cursor-pointer text-secondary" onClick={() => handleRemove(draft.draftId)} />
            </div>
            <div
                className={classNames('my-2 cursor-pointer text-fourMain', {
                    'text-third': isDisabled,
                })}
                onClick={() => {
                    if (isDisabled) {
                        enqueueErrorMessage(<Trans>Cannot choose due to account mismatch.</Trans>);
                        return;
                    }

                    if (hasError && draft.posts.length > 1) {
                        ConfirmModalRef.open({
                            title: <Trans>Resend full or remaining?</Trans>,
                            content: (
                                <div className="text-main">
                                    <Trans>Do you want to retry with the full or remaining content?</Trans>
                                </div>
                            ),
                            enableCancelButton: true,
                            cancelButtonText: <Trans>Full</Trans>,
                            confirmButtonText: <Trans>Remaining</Trans>,
                            variant: 'normal',
                            onConfirm: () => {
                                handleApply(draft);
                            },
                            onCancel: () => {
                                handleApply(draft, true);
                            },
                        });

                        return;
                    }

                    handleApply(draft);
                }}
            >
                <div className="line-clamp-5 min-h-[24px] break-words text-left text-medium leading-6">{content}</div>
                <div className="text-left">
                    {compact([
                        post?.images.length ? t`[Photo]` : undefined,
                        post?.videos.length ? t`[Video]` : undefined,
                        post?.rpPayload ? t`[LuckyDrop]` : undefined,
                        post?.poll ? t`[Poll]` : undefined,
                    ]).join('')}
                </div>
            </div>
            <div className="flex gap-x-1">
                <span className="flex items-center gap-x-1 font-bold">
                    {post?.availableSources.map((y) => (
                        <SocialSourceIcon key={y} source={y} size={20} />
                    ))}
                </span>
                <span className="text-[13px] font-medium leading-6 text-secondary">
                    <Trans>Saved on {dayjs(draft.createdAt).format('ddd, MMM DD, YYYY [at] h:mm A')}</Trans>
                </span>
            </div>
        </div>
    );
});

export const DraftList = memo(function DraftList() {
    const profiles = useCurrentProfiles();
    const { drafts, removeDraft } = useComposeDraftStateStore();
    const { updateChars, apply, focused, currentDraftId, clear } = useComposeStateStore();
    const { updateScheduleTime } = useComposeScheduleStateStore();
    const setEditorContent = useSetEditorContent();

    const router = useRouter();
    const handleRemove = useCallback(
        async (id: string) => {
            const confirmed = await ConfirmModalRef.openAndWaitForClose({
                title: <Trans>Delete</Trans>,
                content: (
                    <div className="text-fourMain">
                        <Trans>This can’t be undone and you’ll lose your draft.</Trans>
                    </div>
                ),
                confirmButtonText: <Trans>Confirm</Trans>,
                enableCancelButton: true,
            });

            if (!confirmed) return;
            if (currentDraftId) clear();
            removeDraft(id);
            captureDraftDeleteClickEvent();
        },
        [removeDraft, currentDraftId, clear],
    );

    const handleApply = useCallback(
        async (draft: Draft, full = false) => {
            if (draft.type === 'reply' || draft.type === 'quote') {
                const target = first(draft.posts);
                const post = first(compact(values(target?.parentPost)));

                if (post) {
                    const provider = resolveSocialMediaProvider(post.source);
                    const detail = await provider.getPostById(post.postId);
                    if (detail.isHidden) {
                        enqueueErrorMessage(<Trans>The post you quoted/replied has already deleted</Trans>);
                        return;
                    }
                }
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
            });
            const post = draft.posts.find((x) => x.id === draft.cursor);
            if (post) {
                updateChars(post.chars, post.id);
                setEditorContent(post.chars);
            }
            if (draft.scheduleTime) updateScheduleTime(draft.scheduleTime);
            router.history.push('/');
        },
        [apply, router, setEditorContent, updateChars, updateScheduleTime, profiles, focused],
    );

    if (!drafts.length) {
        return (
            <div className="flex min-h-[478px] flex-col justify-center">
                <NoResultsFallback className="h-full" />
            </div>
        );
    }

    return (
        <div className="no-scrollbar h-[478px] overflow-auto px-6">
            {orderBy(
                drafts,
                (x) => {
                    return dayjs(x.createdAt).unix();
                },
                'desc',
            ).map((draft, index) => (
                <DraftListItem
                    draft={draft}
                    key={`${draft.draftId}-${index}`}
                    handleRemove={handleRemove}
                    handleApply={handleApply}
                />
            ))}
        </div>
    );
});
