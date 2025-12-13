import { Trans } from '@lingui/react/macro';

import { SITE_URL_OFFICIAL } from '@/constants/static.js';
import { isSameOriginUrl } from '@/helpers/isSameOriginUrl.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';

const WHITELIST: Array<string | ((url: string) => boolean)> = [
    (url) => isSameOriginUrl(url, location.origin),
    SITE_URL_OFFICIAL,
];

type ConfirmLeavingModalOpenProps = string;

type ConfirmLeavingModalCloseProps = boolean;
type Props = {
    ref: React.Ref<SingletonModalRefCreator<ConfirmLeavingModalOpenProps, ConfirmLeavingModalCloseProps>>;
};

export function ConfirmLeavingModal({ ref }: Props) {
    useSingletonModal(ref, {
        onOpen: async (url) => {
            // urls in the whitelist will not trigger the modal
            if (WHITELIST.some((x) => (typeof x === 'function' ? x(url) : isSameOriginUrl(url, x)))) {
                setTimeout(() => {
                    ConfirmModalRef.close(true);
                    ConfirmLeavingModalRef.close(true);
                }, 100);
                return;
            }

            ConfirmModalRef.open({
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
                    ConfirmModalRef.close(true);
                    ConfirmLeavingModalRef.close(true);
                },
                onCancel() {
                    ConfirmModalRef.close(false);
                    ConfirmLeavingModalRef.close(false);
                },
            });
        },
    });

    return null;
}

export const ConfirmLeavingModalRef = new SingletonModal<ConfirmLeavingModalOpenProps, ConfirmLeavingModalCloseProps>();
