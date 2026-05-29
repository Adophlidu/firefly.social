import { SITE_URL_OFFICIAL } from '@dimensiondev/constants/static';
import { Trans } from '@lingui/react/macro';

import { isSameOriginUrl } from '@/helpers/isSameOriginUrl.js';
import { closeConfirmModal, openConfirmModal } from '@/helpers/openConfirmModal.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { ConfirmLeavingModalRefType } from '@/modals/ConfirmLeavingModal/refs.js';

const WHITELIST: Array<string | ((url: string) => boolean)> = [
    (url) => isSameOriginUrl(url, location.origin),
    SITE_URL_OFFICIAL,
];

interface Props {
    ref: React.Ref<ConfirmLeavingModalRefType>;
}

export function ConfirmLeavingModal({ ref }: Props) {
    useSingletonModal(ref, {
        name: 'confirm-leaving-modal',
        onOpen: async (url) => {
            // urls in the whitelist will not trigger the modal
            if (WHITELIST.some((x) => (typeof x === 'function' ? x(url) : isSameOriginUrl(url, x)))) {
                setTimeout(() => {
                    closeConfirmModal(true);
                    closeConfirmLeavingModal(true);
                }, 100);
                return;
            }

            openConfirmModal({
                title: <Trans>Leaving Firefly</Trans>,
                content: (
                    <div className="text-main">
                        <Trans>
                            Please be cautious when connecting your wallet, as malicious websites may attempt to access
                            your funds.
                        </Trans>
                    </div>
                ),
                onConfirm() {
                    closeConfirmModal(true);
                    closeConfirmLeavingModal(true);
                },
                onCancel() {
                    closeConfirmModal(false);
                    closeConfirmLeavingModal(false);
                },
            });
        },
    });

    return null;
}
