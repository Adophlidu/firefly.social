'use client';

import { memo, useEffect, useState } from 'react';

import type { DirectMessagePanelTarget } from '@/controllers/openDirectMessagePanel.js';
import { OPEN_DIRECT_MESSAGE_PANEL_EVENT } from '@/controllers/openDirectMessagePanel.js';
import { dynamic } from '@/esm/dynamic.js';
import { usePathname } from '@/esm/navigation.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

const DirectMessagePanel = dynamic(
    () => import('@/components/DirectMessages/DirectMessagePanel.js').then((module) => module.DirectMessagePanel),
    { ssr: false },
);

interface PanelRequest {
    id: number;
    target: DirectMessagePanelTarget;
}

export const DirectMessagePanelHost = memo(function DirectMessagePanelHost() {
    const pathname = usePathname();
    const isWalletOpen = useGlobalState.use.fireflyWalletIsOpen();
    const { updateDirectMessagePanelIsOpen, updateFireflyWalletIsOpen } = useGlobalState();
    const [request, setRequest] = useState<PanelRequest>();

    useEffect(() => {
        const handleOpen = (event: Event) => {
            const { detail } = event as CustomEvent<DirectMessagePanelTarget>;
            updateFireflyWalletIsOpen(false);
            setRequest((current) => ({ id: (current?.id ?? 0) + 1, target: detail }));
        };

        window.addEventListener(OPEN_DIRECT_MESSAGE_PANEL_EVENT, handleOpen);
        return () => window.removeEventListener(OPEN_DIRECT_MESSAGE_PANEL_EVENT, handleOpen);
    }, [updateFireflyWalletIsOpen]);

    useEffect(() => {
        if (isWalletOpen || pathname.startsWith('/messages')) setRequest(undefined);
    }, [isWalletOpen, pathname]);

    useEffect(() => {
        updateDirectMessagePanelIsOpen(Boolean(request));
    }, [request, updateDirectMessagePanelIsOpen]);

    useEffect(() => () => updateDirectMessagePanelIsOpen(false), [updateDirectMessagePanelIsOpen]);

    if (!request) return null;

    return (
        <DirectMessagePanel openRequestId={request.id} target={request.target} onClose={() => setRequest(undefined)} />
    );
});
