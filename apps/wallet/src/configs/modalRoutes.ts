export enum ModalType {
    Receive = 'receive',
    ExportBetKey = 'export-bet-key',
    DepositViaCrypto = 'deposit-via-crypto',
}

export interface RouteModalProps {
    open: boolean;
    modalType: ModalType;
    onClose: (typeId: ModalType, skipRedirect?: boolean) => void;
}

export const MODAL_REDIRECTS = [
    { from: '/receive', to: '/', modal: ModalType.Receive },
    { from: '/bet/export-key', to: '/bet', modal: ModalType.ExportBetKey },
    { from: '/bet/deposit-via-crypto', to: '/bet', modal: ModalType.DepositViaCrypto },
] as const;

/**
 * Target URL of a modal redirect (path + `?modal=...`). @dimensiondev/ssr has
 * no `redirect()` primitive, so callers navigate to this URL instead of
 * throwing a TanStack redirect.
 */
export function getModalRedirectUrl(from: string): string {
    const config = MODAL_REDIRECTS.find((r) => r.from === from);
    if (!config) {
        throw new Error(`No modal redirect config found for: ${from}`);
    }
    return `${config.to}?modal=${config.modal}`;
}
