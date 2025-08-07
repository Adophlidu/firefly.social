import { Trans } from '@lingui/react/macro';

import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

type Props = {
    ref: React.Ref<SingletonModalRefCreator>;
};

export function DownloadMobileAppModal({ ref }: Props) {
    const [open, dispatch, mounted] = useSingletonModal(ref);

    return (
        <Modal open={open} onClose={() => dispatch?.close()}>
            <ModalTitle
                title={<Trans>Scan and Get Firefly Mobile App</Trans>}
                enableClose
                onClose={() => dispatch?.close()}
            />
            hi
        </Modal>
    );
}

export const DownloadMobileAppModalRef = new SingletonModal();
