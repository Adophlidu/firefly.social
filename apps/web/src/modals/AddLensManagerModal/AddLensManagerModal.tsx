import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { AddLensManagerModalOpenProps, AddLensManagerModalRefType } from '@/modals/AddLensManagerModal/refs.js';

const AddLensManagerModalContent = dynamic(
    () =>
        import('@/modals/AddLensManagerModal/AddLensManagerModalContent.js').then((m) => m.AddLensManagerModalContent),
    {
        ssr: false,
        loading: () => <Loading minHeight={144.5} />,
    },
);

interface Props {
    ref: React.Ref<AddLensManagerModalRefType>;
}

export function AddLensManagerModal({ ref }: Props) {
    const [props, setProps] = useState<AddLensManagerModalOpenProps>();
    const [loading, setLoading] = useState(false);

    const [open, dispatch, mounted] = useSingletonModal(ref, {
        onOpen: (props) => setProps(props),
        onClose: () => {
            setProps(undefined);
            setLoading(false);
        },
    });
    const onClose = useCallback(
        (status?: boolean) => {
            if (!loading) {
                dispatch?.close(status);
            }
        },
        [dispatch, loading],
    );

    if (!props || !mounted) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="relative flex w-[400px] max-w-[clamp(386px,90vw,95vw)] flex-col rounded-xl bg-bgModal shadow-popover transition-all dark:text-gray-950">
                <ModalTitle buttonDisabled={loading} title={<Trans>Lens Auto Login</Trans>} onClose={onClose} />
                <div className="px-6 pb-6 pt-0">
                    <AddLensManagerModalContent {...props} onFinished={onClose} onLoadingChange={setLoading} />
                </div>
            </div>
        </Modal>
    );
}
