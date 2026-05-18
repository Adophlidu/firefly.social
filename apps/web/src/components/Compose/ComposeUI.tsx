'use client';

import Close from '@dimensiondev/assets/close.svg';
import Info from '@dimensiondev/assets/info.svg';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ComposeActions } from '@/components/Compose/ComposeActions/index.js';
import { ComposeContent } from '@/components/Compose/ComposeContent.js';
import { ComposeThreadContent } from '@/components/Compose/ComposeThreadContent.js';
import { SchedulePostEntryButton } from '@/components/Compose/SchedulePostEntryButton.js';
import { UploadDropArea } from '@/components/Compose/UploadDropArea.js';
import { useUpdateImages } from '@/components/Compose/useUpdateImages.js';
import { useUpdateVideos } from '@/components/Compose/useUpdateVideos.js';
import { CloseButton } from '@/components/IconButton.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { isImageFileType, isMediaFileType, isVideoFileType } from '@/helpers/isMediaFileType.js';
import { isValidPostImage } from '@/helpers/validatePostFile.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export function Title() {
    const { type } = useComposeStateStore();

    switch (type) {
        case 'compose':
            return <Trans>Compose</Trans>;
        case 'quote':
            return <Trans>Quote</Trans>;
        case 'reply':
            return <Trans>Reply</Trans>;
        default:
            safeUnreachable(type);
            return <Trans>Compose</Trans>;
    }
}

export const ComposeUI = memo(function ComposeUI() {
    const isMedium = useIsMedium();
    const isDark = useIsDarkMode();
    const { type, posts, isFailedSchedulePost, showMediaAlert, setShowMediaAlert, updateIsFailedSchedulePost } =
        useComposeStateStore();
    const { scheduleTime, disableSchedule } = useComposeScheduleStateStore();

    const compositePost = useCompositePost();

    const availableSources = compositePost.availableSources;

    const { available, keyboardHeight } = useKeyboardHeight();

    const updateImages = useUpdateImages();
    const updateVideos = useUpdateVideos();
    const [{ loading }, handleDropFiles] = useAsyncFn(
        async (files: File[]) => {
            const validFiles = files.filter((file) => isMediaFileType(file.type));
            if (!validFiles.length) return;
            const validImages = validFiles.filter((file) => {
                if (!isImageFileType(file.type)) return false;
                const message = isValidPostImage(availableSources, file);
                if (message) {
                    enqueueErrorMessage(message);
                    return false;
                }
                return true;
            });
            updateImages(validImages, availableSources, type);

            const videos = validFiles.filter((file) => isVideoFileType(file.type));
            if (videos.length) {
                await updateVideos(videos, availableSources);
            }
        },
        [availableSources, type, updateImages, updateVideos],
    );

    return (
        <>
            <div
                className={classNames(
                    'no-scrollbar flex min-h-[318px] flex-col overflow-auto px-4 pb-4',
                    isMedium ? 'h-full' : available ? 'flex-1' : 'max-h-[300px] min-h-[300px]',
                    isFailedSchedulePost ? 'min-h-[398px]' : '',
                )}
                style={{
                    maxHeight: isMedium ? 'calc(100vh - 184px)' : undefined,
                }}
            >
                {isFailedSchedulePost ? (
                    <div className="bg-bg mb-6 flex items-center gap-1.5 rounded-[4px] p-3">
                        <Info width={20} height={20} className="text-main shrink-0" />
                        <div className="text-main text-left text-xs leading-4">
                            <Trans>
                                For a failed scheduled post, only the text content can be restored. Please redo the
                                <br />
                                cross @, media uploads, and other actions.
                            </Trans>
                        </div>
                        <Close
                            width={20}
                            height={20}
                            className="text-main shrink-0 cursor-pointer"
                            onClick={() => {
                                updateIsFailedSchedulePost(false);
                            }}
                        />
                    </div>
                ) : null}
                {showMediaAlert ? (
                    <div className="bg-bg mb-3 flex items-center gap-1.5 rounded px-3 py-2 backdrop-blur-sm">
                        <Info width={20} height={20} className="text-main shrink-0" />
                        <p className="text-main min-w-0 flex-1 text-left text-xs leading-4">
                            <Trans>
                                Note: Cloud drafts save text only. Please upload original images or video again.
                            </Trans>
                        </p>
                        <CloseButton
                            size={20}
                            className="text-main shrink-0"
                            onClick={() => setShowMediaAlert(false)}
                        />
                    </div>
                ) : null}
                <UploadDropArea
                    className="bg-bg flex h-full flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-lg border p-[14px]"
                    loading={loading}
                    onDropFiles={handleDropFiles}
                    style={
                        compositePost.isAnonymous
                            ? {
                                  backgroundImage: isDark
                                      ? "url('/image/ghost-dark.png')"
                                      : "url('/image/ghost-light.png')",
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'center center',
                                  backgroundSize: '80px 80px',
                              }
                            : undefined
                    }
                >
                    {scheduleTime && !disableSchedule && envs.external.NEXT_PUBLIC_SCHEDULE_POST === STATUS.Enabled ? (
                        <SchedulePostEntryButton showText />
                    ) : null}
                    {posts.length === 1 ? <ComposeContent post={compositePost} /> : <ComposeThreadContent />}
                </UploadDropArea>
            </div>

            <ComposeActions />

            {available && !isMedium ? <div style={{ height: keyboardHeight + 56 }} /> : null}
        </>
    );
});
