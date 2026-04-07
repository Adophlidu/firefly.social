import { redirect } from '@tanstack/react-router';

export enum ModalType {
    Receive = 'receive',
    ExportBetKey = 'export-bet-key',
}

export interface RouteModalProps {
    open: boolean;
    modalType: ModalType;
    onClose: (typeId: ModalType, skipRedirect?: boolean) => void;
}

export const MODAL_REDIRECTS = [
    { from: '/receive', to: '/', modal: ModalType.Receive },
    { from: '/bet/export-key', to: '/bet', modal: ModalType.ExportBetKey },
] as const;

export function redirectToModal(from: string): never {
    const config = MODAL_REDIRECTS.find((r) => r.from === from);
    if (!config) {
        throw new Error(`No modal redirect config found for: ${from}`);
    }
    throw redirect({ to: config.to, search: { modal: config.modal } });
}
