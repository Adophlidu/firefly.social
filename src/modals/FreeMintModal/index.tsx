import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';

import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { MintMetadata, SponsorMintOptions } from '@/providers/types/Firefly.js';

export interface FreeMintModalOpenProps {
    mintTarget: SponsorMintOptions;
    mintParams: MintMetadata;
    onSuccess?: () => void;
}
type Props = {
    ref: React.Ref<SingletonModalRefCreator<FreeMintModalOpenProps>>;
};

const MintModalContent = dynamic(() => import('@/modals/FreeMintModal/MintModalContent.js'), {
    ssr: false,
    loading: () => null,
});

export function FreeMintModal({ ref }: Props) {
    const [props, setProps] = useState<FreeMintModalOpenProps>();

    const [open, dispatch, mounted] = useSingletonModal(ref, {
        onOpen: (props) => setProps(props),
        onClose: () => setProps(undefined),
    });
    const onClose = useCallback(() => dispatch?.close(), [dispatch]);
    const onMinted = useCallback(() => {
        onClose();
        props?.onSuccess?.();
    }, [props, onClose]);

    if (!props) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="relative w-[400px] max-w-[90vw] rounded-2xl bg-primaryBottom p-6 transition-all">
                <DialogTitle as="h3" className="relative text-center text-main">
                    <CloseButton onClick={onClose} className="absolute -top-1 left-0" />
                    <span className="text-lg font-bold leading-[22px]">
                        <Trans>Mint NFT</Trans>
                    </span>
                </DialogTitle>
                {mounted ? <MintModalContent {...props} onSuccess={onMinted} /> : null}
            </div>
        </Modal>
    );
}

export const FreeMintModalRef = new SingletonModal<FreeMintModalOpenProps>();
