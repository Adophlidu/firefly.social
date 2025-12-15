import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { dynamic } from '@/esm/dynamic.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';

interface AddWalletModalProps {
    connections: FireflyWalletConnection[];
}

interface AddWalletModalCloseProps {
    response?: BindWalletResponse['data'];
}
interface Props {
    ref: React.Ref<SingletonModalRefCreator<AddWalletModalProps, AddWalletModalCloseProps>>;
}

const SelectNetworkModalContent = dynamic(() => import('@/modals/AddWalletModal/SelectNetworkModalUI.js'), {
    ssr: false,
    loading: () => null,
});

export function AddWalletModal({ ref }: Props) {
    const isMedium = useIsMedium();
    const [{ connections }, setProps] = useState<AddWalletModalProps>({
        connections: EMPTY_LIST,
    });
    const [open, dispatch, mounted] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
        onClose: () => {
            setProps({ connections: EMPTY_LIST });
        },
    });

    const closeModal = () => dispatch?.abort?.(new Error(`User reject`));

    if (!isMedium) {
        return (
            <Popover open={open} onClose={closeModal}>
                {mounted ? (
                    <SelectNetworkModalContent
                        onConfirm={(result) => dispatch?.close({ response: result })}
                        onClose={(reason) => dispatch?.abort?.(reason)}
                        connections={connections}
                    />
                ) : null}
            </Popover>
        );
    }

    return (
        <Modal open={open} onClose={closeModal}>
            <div className="h-[212px] rounded-[12px] bg-primaryBottom transition-all">
                <div
                    className="relative inline-flex items-center justify-center gap-2 rounded-t-[12px] p-4 text-center md:h-[56px] md:w-[600px]"
                    style={{ background: 'var(--m-modal-title-bg)' }}
                >
                    <CloseButton onClick={closeModal} className="absolute left-4 top-4" />
                    <div className="text-lg font-bold leading-6 text-main">
                        <Trans>Select Network</Trans>
                    </div>
                </div>
                {mounted ? (
                    <SelectNetworkModalContent
                        onConfirm={(result) => dispatch?.close({ response: result })}
                        onClose={(reason) => dispatch?.abort?.(reason)}
                        connections={connections}
                    />
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <LoadingIcon />
                    </div>
                )}
            </div>
        </Modal>
    );
}

export const AddWalletModalRef = new SingletonModal<AddWalletModalProps, AddWalletModalCloseProps>();
