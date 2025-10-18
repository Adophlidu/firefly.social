import { Trans } from '@lingui/react/macro';

import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

type Props = {
    ref: React.Ref<SingletonModalRefCreator>;
};

const DownloadMobileAppContent = dynamic(
    () =>
        import('@/modals/DownloadMobileAppModal/DownloadMobileAppContent.js').then(
            (mod) => mod.DownloadMobileAppContent,
        ),
    {
        ssr: false,
        loading: () => <div className="h-[366px] w-full" />,
    },
);

export function DownloadMobileAppModal({ ref }: Props) {
    const [open, dispatch, mounted] = useSingletonModal(ref);

    return (
        <Modal open={open} onClose={() => dispatch?.close()}>
            <div className="w-[420px] max-w-[90vw] rounded-3xl bg-primaryBottom transition-all">
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

export const DownloadMobileAppModalRef = new SingletonModal();
