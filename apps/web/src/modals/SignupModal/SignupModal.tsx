import { Trans } from '@lingui/react/macro';
import { type Ref, useCallback, useState } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { dynamic } from '@/esm/dynamic.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SignupModalCloseProps, SignupModalOpenProps, SignupModalRefType } from '@/modals/SignupModal/refs.js';

const SignupModalContent = dynamic(
    () => import('@/modals/SignupModal/SignupModalContent.js').then((m) => m.SignupModalContent),
    {
        ssr: false,
        loading: () => (
            <div className="flex size-full items-center justify-center">
                <LoadingIcon />
            </div>
        ),
    },
);

interface Props {
    ref: Ref<SignupModalRefType>;
}

export function SignupModal({ ref }: Props) {
    const [props, setProps] = useState<SignupModalOpenProps>();
    const [loading, setLoading] = useState(false);
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
        onClose: () => {
            setProps(undefined);
            setLoading(false);
        },
    });
    const onClose = useCallback(
        (props: SignupModalCloseProps) => {
            if (!loading) {
                dispatch?.close(props);
            }
        },
        [dispatch, loading],
    );

    if (!props) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="bg-primaryBottom relative flex h-screen w-screen flex-col transition-all md:h-[500px] md:w-[400px] md:max-w-[90vw] md:rounded-xl">
                <ModalTitle
                    className="!py-3"
                    onClose={onClose}
                    buttonDisabled={loading}
                    title={<Trans>Create {resolveSourceName(props.source)} Profile</Trans>}
                />
                <div className="min-h-0 w-full flex-1 overflow-hidden">
                    <SignupModalContent source={props.source} onClose={onClose} onLoadingChange={setLoading} />
                </div>
            </div>
        </Modal>
    );
}
