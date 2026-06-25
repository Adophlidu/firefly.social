'use client';

import DownloadIcon from '@dimensiondev/assets/download2.svg';
import ExportIcon from '@dimensiondev/assets/export.svg';
import SendIcon from '@dimensiondev/assets/send2.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { Popover } from '@/components/Popover.js';
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
    cardUrl: string;
    compact?: boolean;
    downloading?: boolean;
    posting?: boolean;
    onSuperfortune: () => void;
    onDownload: () => void;
    onPost: () => void;
}

const SuperfortuneBody = memo(function SuperfortuneBody({
    open,
    cardUrl,
    compact,
    downloading,
    posting,
    onSuperfortune,
    onDownload,
    onPost,
}: SuperfortuneBodyProps) {
    return (
        <>
            <div
                className={classNames(
                    'aspect-[260/406] overflow-hidden rounded-lg',
                    // desktop: fill the modal width; mobile sheet: cap height so the whole card stays visible
                    compact ? 'mx-auto h-[58vh] max-h-[460px]' : 'w-full',
                )}
            >
                {open ? (
                    <iframe
                        title="SuperFortune"
                        src={cardUrl}
                        className="size-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-popups"
                    />
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
    cardUrl: string;
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
