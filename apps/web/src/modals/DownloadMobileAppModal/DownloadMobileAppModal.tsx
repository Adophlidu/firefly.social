import { Trans } from '@lingui/react/macro';

import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { DownloadMobileAppContent } from '@/modals/DownloadMobileAppModal/DownloadMobileAppContent.js';
import type { DownloadMobileAppModalRefType } from '@/modals/DownloadMobileAppModal/refs.js';

interface Props {
    ref: React.Ref<DownloadMobileAppModalRefType>;
}

export function DownloadMobileAppModal({ ref }: Props) {
    const [open, dispatch, mounted] = useSingletonModal(ref);

    return (
        <Modal open={open} onClose={() => dispatch?.close()}>
            <div className="bg-primaryBottom relative w-[420px] max-w-[90vw] rounded-3xl transition-all">
                <ModalTitle
                    enableClose
                    className="!p-6"
                    onClose={() => dispatch?.close()}
                    title={<Trans>Scan and Get Firefly Mobile App</Trans>}
                />
                {mounted ? <DownloadMobileAppContent /> : null}
            </div>
        </Modal>
    );
}
