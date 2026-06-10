import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMutation } from '@tanstack/react-query';
import { Copy, Download, Image as ImageIcon, Loader2, Share, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { Button } from '@/components/ui/button.js';
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
                            className="flex h-12 items-center gap-3 rounded-lg px-3 text-left hover:bg-lightBg"
                            disabled={isPending}
                            onClick={() => postWithImage()}
                        >
                            {isPending ? <Loader2 className="size-5 animate-spin" /> : <ImageIcon className="size-5" />}
                            <span className="text-sm font-bold text-main">
                                <Trans>Post with image</Trans>
                            </span>
                        </button>
                        <button
                            type="button"
                            className="flex h-12 items-center gap-3 rounded-lg px-3 text-left hover:bg-lightBg"
                            onClick={() => {
                                onOpenChange(false);
                                setPreviewOpen(true);
                            }}
                        >
                            <Share className="size-5" />
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
                    <button type="button" onClick={() => onOpenChange(false)} aria-label={t`Close`}>
                        <X className="size-5" />
                    </button>
                </DialogOrDrawerHeader>
                <div className="no-scrollbar relative max-h-[50vh] overflow-y-auto">
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
                <div className="flex flex-col gap-2 pb-2">
                    {supportsImageClipboard() ? (
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            className="h-10 w-full rounded-full font-bold"
                            disabled={loading || hasError}
                            loading={isCopying}
                            onClick={() => copyImage()}
                        >
                            <Copy className="mr-1 size-4" />
                            <Trans>Copy</Trans>
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="h-10 w-full rounded-full font-bold"
                        disabled={loading || hasError}
                        loading={isDownloading}
                        onClick={() => download()}
                    >
                        <Download className="mr-1 size-4" />
                        <Trans>Download</Trans>
                    </Button>
                    <Button
                        type="button"
                        size="lg"
                        variant="primary"
                        className="h-10 w-full rounded-full font-bold"
                        disabled={loading || hasError}
                        loading={isPending}
                        onClick={() => postWithImage()}
                    >
                        <Trans>Post</Trans>
                    </Button>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}

interface PositionShareEntryProps {
    payload: PolymarketShareImagePayload;
    className?: string;
}

/** The share icon entry shown on cell-title hover (FW-7696 AC-11) or in dialog headers (AC-12). */
export function PositionShareEntry({ payload, className }: PositionShareEntryProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <span
                role="button"
                tabIndex={0}
                aria-label={t`Share`}
                className={cn(
                    'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-second hover:bg-lightBg hover:text-main',
                    className,
                )}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setOpen(true);
                }}
                onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    setOpen(true);
                }}
            >
                <Share className="size-4" />
            </span>
            <PositionShareSheet payload={payload} open={open} onOpenChange={setOpen} />
        </>
    );
}
