'use client';

import DownloadIcon from '@dimensiondev/assets/download2.svg';
import ExportIcon from '@dimensiondev/assets/export.svg';
import SendIcon from '@dimensiondev/assets/send2.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode, useEffect, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { Popover } from '@/components/Popover.js';
import { SuperfortuneSpinningIcon } from '@/components/Prediction/Superfortune/SuperfortuneSpinningIcon.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

interface SuperfortuneActionProps {
    icon: ReactNode;
    label: ReactNode;
    loading?: boolean;
    onClick: () => void;
}

const SuperfortuneAction = memo(function SuperfortuneAction({
    icon,
    label,
    loading,
    onClick,
}: SuperfortuneActionProps) {
    return (
        <div className="flex flex-col items-center gap-1">
            <ClickableButton
                className={classNames(
                    'flex size-12 items-center justify-center rounded-full border border-line text-main',
                    loading ? 'cursor-wait opacity-50' : 'cursor-pointer',
                )}
                disabled={loading}
                onClick={onClick}
            >
                {icon}
            </ClickableButton>
            <span className="text-xs font-medium leading-[14px] text-main">{label}</span>
        </div>
    );
});

interface SuperfortuneBodyProps {
    open: boolean;
    imageUrl: string;
    compact?: boolean;
    downloading?: boolean;
    posting?: boolean;
    onSuperfortune: () => void;
    onDownload: () => void;
    onPost: () => void;
}

const SuperfortuneBody = memo(function SuperfortuneBody({
    open,
    imageUrl,
    compact,
    downloading,
    posting,
    onSuperfortune,
    onDownload,
    onPost,
}: SuperfortuneBodyProps) {
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setHasError(false);
    }, [open, imageUrl]);

    return (
        <>
            <div
                className={classNames(
                    'relative aspect-[260/406] overflow-hidden rounded-lg',
                    // desktop: fill the modal width; mobile sheet: cap height so the whole card stays visible
                    compact ? 'mx-auto h-[58vh] max-h-[460px]' : 'w-full',
                )}
            >
                {open ? (
                    <>
                        {loading || hasError ? (
                            <div className="absolute inset-0 z-1 flex flex-col items-center justify-center gap-3 bg-primaryBottom">
                                {loading ? (
                                    <>
                                        <SuperfortuneSpinningIcon size={44} durationSeconds={1.6} />
                                        <span className="text-medium font-medium text-secondary">
                                            <Trans>Decoding the sign…</Trans>
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-medium font-medium text-secondary">
                                        <Trans>Failed to load image.</Trans>
                                    </span>
                                )}
                            </div>
                        ) : null}
                        {/* eslint-disable-next-line @next/next/no-img-element -- external partner image, not a configured next/image host */}
                        <img
                            alt="SuperFortune"
                            src={imageUrl}
                            className="size-full object-cover"
                            onLoad={() => setLoading(false)}
                            onError={() => {
                                setLoading(false);
                                setHasError(true);
                            }}
                        />
                    </>
                ) : null}
            </div>
            <div className="mt-4 flex items-center justify-between px-2">
                <SuperfortuneAction
                    icon={<ExportIcon width={20} height={20} />}
                    label={<Trans>Superfortune</Trans>}
                    onClick={onSuperfortune}
                />
                <SuperfortuneAction
                    icon={<DownloadIcon width={20} height={20} />}
                    label={<Trans>Download</Trans>}
                    loading={downloading}
                    onClick={onDownload}
                />
                <SuperfortuneAction
                    icon={<SendIcon width={20} height={20} />}
                    label={<Trans>Post</Trans>}
                    loading={posting}
                    onClick={onPost}
                />
            </div>
        </>
    );
});

interface SuperfortuneModalProps {
    open: boolean;
    imageUrl: string;
    downloading?: boolean;
    posting?: boolean;
    onClose: () => void;
    onSuperfortune: () => void;
    onDownload: () => void;
    onPost: () => void;
}

export const SuperfortuneModal = memo(function SuperfortuneModal({ onClose, ...rest }: SuperfortuneModalProps) {
    const isMedium = useIsMedium();

    if (isMedium) {
        return (
            <Modal open={rest.open} onClose={onClose} title={<Trans>Sign Decoded</Trans>} enableClose size="xs">
                <SuperfortuneBody {...rest} />
            </Modal>
        );
    }

    return (
        <Popover open={rest.open} onClose={onClose} enableOverflow={false} dialogPanelClassName="!p-0">
            <ModalTitle title={<Trans>Sign Decoded</Trans>} enableClose onClose={onClose} />
            <div className="px-6 pb-6">
                <SuperfortuneBody {...rest} compact />
            </div>
        </Popover>
    );
});
