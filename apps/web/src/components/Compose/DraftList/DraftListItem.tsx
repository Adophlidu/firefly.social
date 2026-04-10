'use client';

import CloudIcon from '@dimensiondev/assets/cloud.svg';
import Trash from '@dimensiondev/assets/trash2.svg';
import { classNames, runInSafeAsync } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { compact, first, values } from 'lodash-es';
import { memo, useMemo } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableArea } from '@/components/ClickableArea.js';
import { IconButton } from '@/components/IconButton.js';
import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { queryClient } from '@/configs/queryClient.js';
import { DraftPostType } from '@/constants/enum.js';
import { readChars } from '@/helpers/chars.js';
import { enqueueErrorMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { useApplyDraftPost } from '@/hooks/useApplyDraftPost.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { deleteCloudDraft } from '@/providers/firefly/cloud-draft/deleteCloudDraft.js';
import { captureDraftDeleteClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { type Draft, useComposeDraftState } from '@/store/useComposeDraftStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface DraftListItemProps {
    draft: Draft;
}

export const DraftListItem = memo<DraftListItemProps>(function DraftListItem({ draft }) {
    const router = useRouter();
    const profiles = useCurrentProfiles();
    const { currentProfileSession } = useFireflyProfileStore();
    const { currentDraftId, clear } = useComposeStateStore();

    const [, applyDraftPost] = useApplyDraftPost();
    const { removeDraft } = useComposeDraftState();

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
                const profileUrl = post?.author ? getProfileUrl(post.author) : '';

                return post?.author ? (
                    <Trans>
                        REPLY to
                        <span className="ml-1">
                            <Link href={profileUrl}>@{post?.author.handle}</Link>
                        </span>
                    </Trans>
                ) : (
                    <Trans>REPLY</Trans>
                );
            case 'quote':
                return <Trans>QUOTE</Trans>;
        }
    }, [draft, hasError]);

    const post = first(draft.posts);
    const content = post ? readChars({ chars: post.chars, strategy: 'visible' }) : '';

    const isDisabled = useMemo(() => {
        return !draft.availableProfiles.some((x) => profiles.some((profile) => profile.source === x.source));
    }, [profiles, draft.availableProfiles]);

    const [{ loading: isRemoving }, handleRemove] = useAsyncFn(async () => {
        try {
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
            if (draft.draftType !== DraftPostType.Cloud) {
                removeDraft(draft.draftId);
            }
            const cloudDraftId = draft.draftType === DraftPostType.Cloud ? draft.draftId : draft.cloudDraftId;
            if (cloudDraftId) {
                await runInSafeAsync(async () => {
                    await deleteCloudDraft(cloudDraftId);
                    if (currentProfileSession?.profileId) {
                        await queryClient.refetchQueries({
                            queryKey: ['cloud-drafts', currentProfileSession.profileId],
                        });
                    }
                });
            }
            captureDraftDeleteClickEvent();
        } catch (error) {
            enqueueErrorMessage(<Trans>Failed to remove draft. Please try again.</Trans>, { error });
            throw error;
        }
    }, [
        currentDraftId,
        draft.cloudDraftId,
        draft.draftId,
        draft.draftType,
        currentProfileSession?.profileId,
        removeDraft,
        clear,
    ]);

    const [{ loading: isApplying }, handleApply] = useAsyncFn(async () => {
        if (isDisabled) {
            enqueueWarningMessage(<Trans>Connect the required social profile to select.</Trans>);
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
                onConfirm: async () => {
                    await applyDraftPost(draft);
                    router.history.push('/');
                },
                onCancel: async () => {
                    await applyDraftPost(draft, true);
                    router.history.push('/');
                },
            });

            return;
        }

        await applyDraftPost(draft);
        router.history.push('/');
    }, [draft, isDisabled, hasError, router.history, applyDraftPost]);

    return (
        <ClickableArea
            className={classNames(
                'border-line border-b py-3 last:border-b-0',
                isApplying ? 'cursor-not-allowed' : 'cursor-pointer',
            )}
            disabled={isApplying}
            onClick={handleApply}
        >
            <div className="flex h-7 items-center justify-between">
                <div
                    className={classNames('flex items-center gap-1 text-[12px] font-bold', {
                        'text-danger': hasError,
                        'text-secondary': !hasError,
                    })}
                >
                    {title}
                    {isApplying ? <LoadingIcon size={20} className="text-second" /> : null}
                </div>
                {isRemoving ? (
                    <LoadingIcon size={20} className="text-secondary" />
                ) : (
                    <IconButton
                        tooltip={<Trans>Remove</Trans>}
                        disabled={isRemoving || isApplying}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                    >
                        <Trash className="text-secondary size-5 cursor-pointer" onClick={handleRemove} />
                    </IconButton>
                )}
            </div>
            <div
                className={classNames('text-fourMain my-2 cursor-pointer', {
                    'text-third': isDisabled || isApplying,
                })}
            >
                <div className="text-medium line-clamp-5 min-h-[24px] break-words text-left leading-6">{content}</div>
                <div className="text-left">
                    {compact([
                        post?.images.length ? t`[Photo]` : undefined,
                        post?.videos.length ? t`[Video]` : undefined,
                        post?.rpPayload ? t`[LuckyDrop]` : undefined,
                        post?.poll ? t`[Poll]` : undefined,
                    ]).join('')}
                </div>
            </div>
            <div className="flex items-center gap-x-1">
                <span className="flex items-center gap-x-1 font-bold">
                    {post?.availableSources.map((y) => (
                        <SocialSourceIcon key={y} source={y} size={20} />
                    ))}
                </span>
                <span className="text-secondary text-left text-[13px] font-medium leading-6">
                    <Trans>Saved on {dayjs(draft.createdAt).format('ddd, MMM DD, YYYY [at] h:mm A')}</Trans>
                </span>
                {draft.draftType === DraftPostType.Cloud ? (
                    <Tooltip placement="top" content={<Trans>Cloud Draft</Trans>}>
                        <CloudIcon className="text-secondary shrink-0" width={16} height={16} />
                    </Tooltip>
                ) : null}
            </div>
        </ClickableArea>
    );
});
