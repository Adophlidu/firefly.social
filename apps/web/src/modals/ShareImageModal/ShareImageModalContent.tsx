import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { downloadImage } from '@/helpers/downloadImage.js';
import { enqueueInfoMessage } from '@/helpers/enqueueMessage.js';

interface ShareImageModalContentProps {
    imageUrl: string;
    aspectRatio?: string;
    onClose: () => void;
}

export function ShareImageModalContent(props: ShareImageModalContentProps) {
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const [{ loading: isDownloading }, handleDownload] = useAsyncFn(async () => {
        try {
            if (!props?.imageUrl) {
                throw new Error('Image URL is not provided');
            }
            await downloadImage(props.imageUrl, 'firefly_tip_share.png');
        } catch (error) {
            enqueueInfoMessage(<Trans>Failed to download image. Please try again later.</Trans>);
            throw error;
        }
    }, [props?.imageUrl]);

    return (
        <div>
            <div className="relative flex h-10 items-center justify-center">
                <CloseButton className="absolute left-0 top-1/2 -translate-y-1/2" onClick={props.onClose} />
                <span className="text-main text-lg font-semibold">
                    <Trans>Share image</Trans>
                </span>
            </div>
            <div className="no-scrollbar relative my-4 max-h-[50vh] overflow-y-auto">
                {loading || hasError ? (
                    <div className="z-1 bg-primaryBottom absolute inset-0 flex items-center justify-center">
                        {loading ? (
                            <LoadingIcon width={24} height={24} className="text-main" />
                        ) : hasError ? (
                            <span className="text-medium text-secondary font-medium">
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
            <ClickableButton
                disabled={loading || hasError}
                loading={isDownloading}
                className="bg-main text-medium text-primaryBottom h-10 w-full rounded-lg text-center font-bold"
                onClick={handleDownload}
            >
                <Trans>Download image</Trans>
            </ClickableButton>
        </div>
    );
}
