import CheckIcon from '@dimensiondev/assets/check.svg';
import CopyLinearIcon from '@dimensiondev/assets/copy-linear.svg';
import Download2Icon from '@dimensiondev/assets/download2.svg';
import Send2Icon from '@dimensiondev/assets/send2.svg';
import { delay } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode, useEffect, useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { copyImageToClipboard, supportsImageClipboard } from '@/helpers/copyImageToClipboard.js';
import { downloadImage } from '@/helpers/downloadImage.js';
import { enqueueInfoMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';

interface ShareImageModalContentProps {
    imageUrl: string;
    aspectRatio?: string;
    fileName?: string;
    enableCopy?: boolean;
    onPost?: () => void | Promise<void>;
    onClose: () => void;
}

interface ShareActionProps {
    label: ReactNode;
    ariaLabel: string;
    icon: ReactNode;
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
}

// A near-instant copy/download (the image is already loaded locally) flips the button's icon to a
// spinner and back within a single frame — reads as a blink rather than a loading state. Floor the
// visible duration so the spinner (or the checkmark it hands off to) is actually perceptible.
const MIN_LOADING_DURATION_MS = 400;

const ShareAction = memo(function ShareAction({
    label,
    ariaLabel,
    icon,
    disabled,
    loading,
    onClick,
}: ShareActionProps) {
    return (
        <div className="flex w-20 flex-col items-center gap-1">
            <ClickableButton
                aria-label={ariaLabel}
                disabled={disabled}
                loading={loading}
                onlyLoading
                className="flex size-12 items-center justify-center rounded-full border border-secondaryLine text-main"
                onClick={onClick}
            >
                {icon}
            </ClickableButton>
            <span className="w-full truncate text-center text-xs font-medium leading-[14px] text-main">{label}</span>
        </div>
    );
});

export const ShareImageModalContent = memo(function ShareImageModalContent(props: ShareImageModalContentProps) {
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const showCopy = props.enableCopy && supportsImageClipboard();

    const [{ loading: isDownloading }, handleDownload] = useAsyncFn(async () => {
        try {
            if (!props?.imageUrl) {
                throw new Error('Image URL is not provided');
            }
            await Promise.all([
                downloadImage(props.imageUrl, props.fileName || 'firefly_tip_share.png'),
                delay(MIN_LOADING_DURATION_MS),
            ]);
        } catch (error) {
            enqueueInfoMessage(<Trans>Failed to download image. Please try again later.</Trans>);
            throw error;
        }
    }, [props?.imageUrl, props?.fileName]);

    const [copied, setCopied] = useState(false);
    const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

    const [{ loading: isCopying }, handleCopy] = useAsyncFn(async () => {
        try {
            await Promise.all([copyImageToClipboard(props.imageUrl), delay(MIN_LOADING_DURATION_MS)]);
            enqueueSuccessMessage(<Trans>Copied</Trans>);
            setCopied(true);
            clearTimeout(copiedTimerRef.current);
            copiedTimerRef.current = setTimeout(setCopied, 1500, false);
        } catch (error) {
            enqueueInfoMessage(<Trans>Failed to copy image. Please try again later.</Trans>);
            throw error;
        }
    }, [props.imageUrl]);

    // Keep the modal open (with a spinner) while posting, closing only once it actually lands —
    // matches the wallet's PositionSharePreviewDialog instead of closing before the post even starts.
    const { onPost, onClose } = props;
    const [{ loading: isPosting }, handlePost] = useAsyncFn(async () => {
        await Promise.all([onPost?.(), delay(MIN_LOADING_DURATION_MS)]);
        onClose();
    }, [onPost, onClose]);

    return (
        <div>
            <div className="relative flex h-14 items-center justify-center px-4">
                <CloseButton className="absolute left-4 top-1/2 -translate-y-1/2" onClick={props.onClose} />
                <span className="text-lg font-bold leading-[22px] text-main">
                    <Trans>Share image</Trans>
                </span>
            </div>
            <div className="no-scrollbar relative mx-5 max-h-[60vh] overflow-y-auto rounded-xl">
                {loading || hasError ? (
                    <div className="absolute inset-0 z-1 flex items-center justify-center bg-primaryBottom">
                        {loading ? (
                            <LoadingIcon size={24} className="text-main" />
                        ) : hasError ? (
                            <span className="text-medium font-medium text-secondary">
                                <Trans>Failed to load image.</Trans>
                            </span>
                        ) : null}
                    </div>
                ) : null}
                <div
                    className="w-full"
                    style={{
                        aspectRatio: props.aspectRatio || '1 / 1',
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={props.imageUrl}
                        alt={'Share image'}
                        className="size-full object-cover"
                        onLoad={() => {
                            setLoading(false);
                        }}
                        onError={() => {
                            setLoading(false);
                            setHasError(true);
                        }}
                    />
                </div>
            </div>
            <div className="mt-3 flex items-start justify-center gap-1.5 px-6 pb-6">
                {showCopy ? (
                    <ShareAction
                        label={copied ? <Trans>Copied</Trans> : <Trans>Copy</Trans>}
                        ariaLabel={copied ? t`Copied` : t`Copy`}
                        icon={
                            copied ? (
                                <CheckIcon width={20} height={20} className="text-success" />
                            ) : (
                                <CopyLinearIcon width={20} height={20} />
                            )
                        }
                        disabled={loading || hasError}
                        loading={isCopying}
                        onClick={handleCopy}
                    />
                ) : null}
                <ShareAction
                    label={<Trans>Download</Trans>}
                    ariaLabel={t`Download`}
                    icon={<Download2Icon width={20} height={20} />}
                    disabled={loading || hasError}
                    loading={isDownloading}
                    onClick={handleDownload}
                />
                {props.onPost ? (
                    <ShareAction
                        label={<Trans>Post</Trans>}
                        ariaLabel={t`Post`}
                        icon={<Send2Icon width={20} height={20} />}
                        disabled={loading || hasError}
                        loading={isPosting}
                        onClick={handlePost}
                    />
                ) : null}
            </div>
        </div>
    );
});
