import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
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
    onPost?: () => void;
    onClose: () => void;
}

export function ShareImageModalContent(props: ShareImageModalContentProps) {
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const showCopy = props.enableCopy && supportsImageClipboard();

    const [{ loading: isDownloading }, handleDownload] = useAsyncFn(async () => {
        try {
            if (!props?.imageUrl) {
                throw new Error('Image URL is not provided');
            }
            await downloadImage(props.imageUrl, props.fileName || 'firefly_tip_share.png');
        } catch (error) {
            enqueueInfoMessage(<Trans>Failed to download image. Please try again later.</Trans>);
            throw error;
        }
    }, [props?.imageUrl, props?.fileName]);

    const [{ loading: isCopying }, handleCopy] = useAsyncFn(async () => {
        try {
            await copyImageToClipboard(props.imageUrl);
            enqueueSuccessMessage(<Trans>Copied</Trans>);
        } catch (error) {
            enqueueInfoMessage(<Trans>Failed to copy image. Please try again later.</Trans>);
            throw error;
        }
    }, [props.imageUrl]);

    return (
        <div>
            <div className="relative flex h-10 items-center justify-center">
                <CloseButton className="absolute left-0 top-1/2 -translate-y-1/2" onClick={props.onClose} />
                <span className="text-lg font-semibold text-main">
                    <Trans>Share image</Trans>
                </span>
            </div>
            <div className="no-scrollbar relative my-4 max-h-[50vh] overflow-y-auto">
                {loading || hasError ? (
                    <div className="absolute inset-0 z-1 flex items-center justify-center bg-primaryBottom">
                        {loading ? (
                            <LoadingIcon width={24} height={24} className="text-main" />
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
            <div className="flex flex-col gap-2">
                {showCopy ? (
                    <ClickableButton
                        disabled={loading || hasError}
                        loading={isCopying}
                        className="h-10 w-full rounded-lg border border-main text-center text-medium font-bold text-main"
                        onClick={handleCopy}
                    >
                        <Trans>Copy</Trans>
                    </ClickableButton>
                ) : null}
                <ClickableButton
                    disabled={loading || hasError}
                    loading={isDownloading}
                    className="h-10 w-full rounded-lg bg-main text-center text-medium font-bold text-primaryBottom"
                    onClick={handleDownload}
                >
                    {props.onPost ? <Trans>Download</Trans> : <Trans>Download image</Trans>}
                </ClickableButton>
                {props.onPost ? (
                    <ClickableButton
                        disabled={loading || hasError}
                        className="h-10 w-full rounded-lg bg-fireflyBrand text-center text-medium font-bold text-white"
                        onClick={() => {
                            props.onClose();
                            props.onPost?.();
                        }}
                    >
                        <Trans>Post</Trans>
                    </ClickableButton>
                ) : null}
            </div>
        </div>
    );
}
