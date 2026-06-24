import CopyLinearIcon from '@dimensiondev/assets/copy-linear.svg';
import Download2Icon from '@dimensiondev/assets/download2.svg';
import SendIcon from '@dimensiondev/assets/send.svg';
import Send2Icon from '@dimensiondev/assets/send2.svg';
import ShareImageIcon from '@dimensiondev/assets/share-image.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';

import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { buildPolymarketShareImageUrl, type PolymarketShareImagePayload } from '@/helpers/polymarketShareImage.js';
import { cn } from '@/lib/utils.js';

function supportsImageClipboard() {
    return typeof ClipboardItem !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.clipboard?.write;
}

async function copyImageToClipboard(imageUrl: string) {
    const blobPromise = fetch(imageUrl).then(async (response) => {
        if (!response.ok) throw new Error(`Failed to fetch image (${response.status})`);
        const blob = await response.blob();
        return blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' });
    });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
}

async function downloadImage(imageUrl: string, fileName: string) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image (${response.status})`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
    } finally {
        URL.revokeObjectURL(url);
    }
}

/**
 * FW-7696 AC-15 — "Post with image" from the wallet iframe: pre-fetch the generated PNG (wallet-side
 * loading/error UX, and it warms the worker cache), then ask the host page to open compose with the
 * image attached via the extended bridge COMPOSE method.
 */
function usePostWithShareImage(payload: PolymarketShareImagePayload, onDone?: () => void) {
    return useMutation({
        async mutationFn() {
            const imageUrl = buildPolymarketShareImageUrl(payload.params);
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`Failed to generate the share image (${response.status})`);
            await iframeBridgeProvider.request(IframeBridgeMethod.COMPOSE, {
                text: payload.link,
                imageUrls: [imageUrl],
            });
        },
        onSuccess() {
            onDone?.();
        },
        onError() {
            toast.error(<Trans>Failed to generate the share image. Please try again.</Trans>);
        },
    });
}

interface PositionShareSheetProps {
    payload: PolymarketShareImagePayload;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** The "Post with image" / "Share image" options (FW-7696). */
export function PositionShareSheet({ payload, open, onOpenChange }: PositionShareSheetProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const { mutate: postWithImage, isPending } = usePostWithShareImage(payload, () => onOpenChange(false));

    return (
        <>
            <DialogOrDrawer open={open} onOpenChange={onOpenChange}>
                <DialogOrDrawerContent className="w-full gap-2 rounded-t-2xl">
                    <VisuallyHidden asChild>
                        <DialogOrDrawerTitle>
                            <Trans>Share position</Trans>
                        </DialogOrDrawerTitle>
                    </VisuallyHidden>
                    <div className="flex flex-col gap-1 py-2">
                        <button
                            type="button"
                            className="flex h-12 items-center gap-3 rounded-lg text-left hover:bg-lightBg"
                            disabled={isPending}
                            onClick={() => postWithImage()}
                        >
                            {isPending ? <Loader2 className="size-5 animate-spin" /> : <SendIcon className="size-5" />}
                            <span className="text-sm font-bold text-main">
                                <Trans>Post with image</Trans>
                            </span>
                        </button>
                        <button
                            type="button"
                            className="flex h-12 items-center gap-3 rounded-lg text-left hover:bg-lightBg"
                            onClick={() => {
                                onOpenChange(false);
                                setPreviewOpen(true);
                            }}
                        >
                            <ShareImageIcon className="size-5" />
                            <span className="text-sm font-bold text-main">
                                <Trans>Share image</Trans>
                            </span>
                        </button>
                    </div>
                </DialogOrDrawerContent>
            </DialogOrDrawer>
            <PositionSharePreviewDialog payload={payload} open={previewOpen} onOpenChange={setPreviewOpen} />
        </>
    );
}

interface ShareActionProps {
    label: ReactNode;
    icon: ReactNode;
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
}

function ShareAction({ label, icon, disabled, loading, onClick }: ShareActionProps) {
    return (
        <div
            className={cn('flex shrink-0 flex-col items-center gap-1', disabled ? 'cursor-not-allowed opacity-50' : '')}
        >
            <button
                type="button"
                onClick={disabled || loading ? undefined : onClick}
                disabled={disabled}
                className="flex size-12 items-center justify-center rounded-full border border-secondaryLine text-main"
            >
                {loading ? <Loader2 className="size-5 animate-spin" /> : icon}
            </button>
            <span className="w-full truncate text-center text-xs font-medium leading-[14px] text-main">{label}</span>
        </div>
    );
}

interface PositionSharePreviewDialogProps {
    payload: PolymarketShareImagePayload;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** The share-image preview with Copy / Download / Post (FW-7696 AC-16). */
export function PositionSharePreviewDialog({ payload, open, onOpenChange }: PositionSharePreviewDialogProps) {
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imageUrl = buildPolymarketShareImageUrl(payload.params);
    const { mutate: postWithImage, isPending } = usePostWithShareImage(payload, () => onOpenChange(false));

    const { mutate: copyImage, isPending: isCopying } = useMutation({
        async mutationFn() {
            await copyImageToClipboard(imageUrl);
        },
        onSuccess() {
            toast.success(<Trans>Copied</Trans>);
        },
        onError() {
            toast.error(<Trans>Failed to copy image. Please try again later.</Trans>);
        },
    });

    const { mutate: download, isPending: isDownloading } = useMutation({
        async mutationFn() {
            await downloadImage(imageUrl, 'firefly_position_share.png');
        },
        onError() {
            toast.error(<Trans>Failed to download image. Please try again later.</Trans>);
        },
    });

    return (
        <DialogOrDrawer open={open} onOpenChange={onOpenChange}>
            <DialogOrDrawerContent className="w-full gap-4 rounded-t-2xl">
                <DialogOrDrawerHeader className="shrink-0 !flex-row items-center justify-between py-3">
                    <DialogOrDrawerTitle>
                        <Trans>Share image</Trans>
                    </DialogOrDrawerTitle>
                </DialogOrDrawerHeader>
                <div className="no-scrollbar relative max-h-[70vh] overflow-y-auto">
                    {loading || hasError ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primaryBottom">
                            {loading ? (
                                <Loader2 className="size-6 animate-spin text-main" />
                            ) : (
                                <span className="text-sm font-medium text-second">
                                    <Trans>Failed to load image.</Trans>
                                </span>
                            )}
                        </div>
                    ) : null}
                    <div className="mx-auto w-full max-w-[300px]" style={{ aspectRatio: '750 / 1200' }}>
                        <img
                            src={imageUrl}
                            alt="Share image"
                            className="size-full rounded-xl object-cover"
                            onLoad={() => setLoading(false)}
                            onError={() => {
                                setLoading(false);
                                setHasError(true);
                            }}
                        />
                    </div>
                </div>
                <div className="mt-3 flex items-start justify-evenly pb-2">
                    {supportsImageClipboard() ? (
                        <ShareAction
                            disabled={loading || hasError}
                            loading={isCopying}
                            icon={<CopyLinearIcon className="size-5" />}
                            label={<Trans>Copy</Trans>}
                            onClick={() => copyImage()}
                        />
                    ) : null}
                    <ShareAction
                        label={<Trans>Download</Trans>}
                        icon={<Download2Icon className="size-5" />}
                        disabled={loading || hasError}
                        loading={isDownloading}
                        onClick={() => download()}
                    />
                    <ShareAction
                        label={<Trans>Post</Trans>}
                        icon={<Send2Icon width={20} height={20} />}
                        disabled={loading || hasError}
                        loading={isPending}
                        onClick={() => postWithImage()}
                    />
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
