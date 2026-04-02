import { memo, type ReactNode } from 'react';

import { CloseButton } from '@/components/IconButton.js';
import { MoreAction } from '@/modals/FrameViewerModal/MoreActionMenu.js';
import { type FrameV2 } from '@/types/frame.js';

interface FramePageProps {
    children: ReactNode;
}

interface FramePageTitleProps {
    frame?: FrameV2;
    children: ReactNode;
    onClose: () => void;
    onReload: () => void;
    onSwitchWallet: () => void;
}

interface FramePageBodyProps {
    children: ReactNode;
}

export const FramePage = memo(function FramePage({ children }: FramePageProps) {
    return <div className="fixed inset-0 z-10 flex h-screen flex-col bg-white dark:bg-black">{children}</div>;
});

export const FramePageTitle = memo(function FramePageTitle({
    frame,
    children,
    onClose,
    onReload,
    onSwitchWallet,
}: FramePageTitleProps) {
    return (
        <div className="flex items-center justify-between bg-lightBg px-4 py-3 text-black shadow-md dark:bg-fireflyBrand dark:text-white">
            <CloseButton onClick={onClose} />
            <div className="flex items-center gap-2 text-center">{children}</div>
            <MoreAction selectable={false} frame={frame} onReload={onReload} onSwitchWallet={onSwitchWallet} />
        </div>
    );
});

export const FramePageBody = memo(function FramePageBody({ children }: FramePageBodyProps) {
    return <div className="relative flex flex-1 items-center justify-center overflow-auto">{children}</div>;
});
