export interface DirectMessagePanelTarget {
    targetUserId: string;
    name: string;
    handle: string;
    avatarUrl?: string;
}

export const OPEN_DIRECT_MESSAGE_PANEL_EVENT = 'open-direct-message-panel';

export function openDirectMessagePanel(target: DirectMessagePanelTarget) {
    if (!window.matchMedia('(min-width: 619px)').matches) return false;

    window.dispatchEvent(
        new CustomEvent<DirectMessagePanelTarget>(OPEN_DIRECT_MESSAGE_PANEL_EVENT, {
            detail: target,
        }),
    );
    return true;
}
