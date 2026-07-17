import CheckIcon from '@dimensiondev/assets/check.svg';
import CopyLinearIcon from '@dimensiondev/assets/copy-linear.svg';
import Download2Icon from '@dimensiondev/assets/download2.svg';
import SendIcon from '@dimensiondev/assets/send.svg';
import Send2Icon from '@dimensiondev/assets/send2.svg';
import ShareImageIcon from '@dimensiondev/assets/share-image.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import type { PolymarketShareImagePayload } from '@/helpers/polymarketShareImage.js';
import { cn } from '@/lib/utils.js';

const SHARE_IMAGE_ASPECT_RATIO = '750 / 1060';
const SHARE_IMAGE_FILE_NAME = 'firefly_position_share.png';

function supportsImageClipboard() {
    return typeof ClipboardItem !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.clipboard?.write;
}

/**
 * FW-7810 — the wallet iframe can't run the satori renderer, so it asks the host (web) to generate the
 * share image and returns a PNG data URL. Memoized per payload via react-query so the preview, copy,
 * download and post all reuse one render.
 */
function useShareImageDataUrl(payload: PolymarketShareImagePayload, enabled: boolean) {
    return useQuery({
        queryKey: ['polymarket-share-image', payload.params],
        enabled,
        staleTime: Infinity,
        gcTime: 5 * 60 * 1000,
        async queryFn() {
            const { dataUrl } = await iframeBridgeProvider.request(
                IframeBridgeMethod.FIREFLY_WALLET_GENERATE_SHARE_IMAGE,
                { params: payload.params },
            );
            return dataUrl;
        },
    });
}

async function copyImageToClipboard(dataUrl: string) {
    const blobPromise = fetch(dataUrl).then(async (response) => {
        const blob = await response.blob();
        return blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' });
    });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
}

async function downloadImage(dataUrl: string, fileName: string) {
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = fileName;
    anchor.click();
}

/**
 * FW-7696 AC-15 — "Post with image" from the wallet iframe: generate the PNG via the host, then ask
 * the host page to open compose with the image attached via the bridge COMPOSE method.
 */
function usePostWithShareImage(payload: PolymarketShareImagePayload, onDone?: () => void) {
    return useMutation({
        async mutationFn() {
            const { dataUrl } = await iframeBridgeProvider.request(
                IframeBridgeMethod.FIREFLY_WALLET_GENERATE_SHARE_IMAGE,
                { params: payload.params },
            );
            await iframeBridgeProvider.request(IframeBridgeMethod.COMPOSE, {
                text: payload.link,
                imageUrls: [dataUrl],
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
    const { data: imageUrl, isLoading, isError } = useShareImageDataUrl(payload, open);
    const ready = !!imageUrl && !isLoading && !isError;
    const { mutate: postWithImage, isPending } = usePostWithShareImage(payload, () => onOpenChange(false));

    const [copied, setCopied] = useState(false);
    const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

    const { mutate: copyImage, isPending: isCopying } = useMutation({
        async mutationFn() {
            if (imageUrl) await copyImageToClipboard(imageUrl);
        },
        onSuccess() {
            toast.success(<Trans>Copied</Trans>);
            setCopied(true);
            clearTimeout(copiedTimerRef.current);
            copiedTimerRef.current = setTimeout(setCopied, 1500, false);
        },
        onError() {
            toast.error(<Trans>Failed to copy image. Please try again later.</Trans>);
        },
    });

    const { mutate: download, isPending: isDownloading } = useMutation({
        async mutationFn() {
            if (imageUrl) await downloadImage(imageUrl, SHARE_IMAGE_FILE_NAME);
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
                <div className="relative flex w-full items-center justify-center">
                    {!ready ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primaryBottom">
                            {isError ? (
                                <span className="text-sm font-medium text-second">
                                    <Trans>Failed to load image.</Trans>
                                </span>
                            ) : (
                                <Loader2 className="size-6 animate-spin text-main" />
                            )}
                        </div>
                    ) : null}
                    {imageUrl ? (
                        // Cap the height with a definite viewport unit (the drawer's own height is auto, so a
                        // percentage max-height would not resolve): the image shrinks to fit a short screen
                        // while keeping the 750×1060 ratio, staying fully visible without covering the buttons.
                        <img
                            src={imageUrl}
                            alt="Share image"
                            className="mx-auto max-h-[60svh] w-auto max-w-[300px] rounded-xl object-cover"
                            style={{ aspectRatio: SHARE_IMAGE_ASPECT_RATIO }}
                        />
                    ) : (
                        <div
                            className="max-h-[60svh] w-full max-w-[300px]"
                            style={{ aspectRatio: SHARE_IMAGE_ASPECT_RATIO }}
                        />
                    )}
                </div>
                <div className="mt-3 flex items-start justify-evenly pb-2">
                    {supportsImageClipboard() ? (
                        <ShareAction
                            disabled={!ready}
                            loading={isCopying}
                            icon={
                                copied ? (
                                    <CheckIcon className="size-5 text-success" />
                                ) : (
                                    <CopyLinearIcon className="size-5" />
                                )
                            }
                            label={copied ? <Trans>Copied</Trans> : <Trans>Copy</Trans>}
                            onClick={() => copyImage()}
                        />
                    ) : null}
                    <ShareAction
                        label={<Trans>Download</Trans>}
                        icon={<Download2Icon className="size-5" />}
                        disabled={!ready}
                        loading={isDownloading}
                        onClick={() => download()}
                    />
                    <ShareAction
                        label={<Trans>Post</Trans>}
                        icon={<Send2Icon width={20} height={20} />}
                        disabled={!ready}
                        loading={isPending}
                        onClick={() => postWithImage()}
                    />
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
