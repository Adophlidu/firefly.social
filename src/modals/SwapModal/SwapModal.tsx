'use client';

import { useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { SwapModalOpenProps } from '@/modals/SwapModal/SwapModalContent.js';

const SwapModalContent = dynamic(
    () => import('@/modals/SwapModal/SwapModalContent.js').then((m) => m.SwapModalContent),
    {
        ssr: false,
        loading: () => <Loading />,
    },
);

type Props = {
    ref: React.Ref<SingletonModalRefCreator<SwapModalOpenProps>>;
};

export function SwapModal({ ref }: Props) {
    const [props, setProps] = useState<SwapModalOpenProps>();
    const [open, dispatch, mounted] = useSingletonModal(ref, {
        onOpen(props) {
            setProps(props);
        },
    });

    return (
        // Fixed to dark mode since the OKX widget fails to response to config changes
        <Modal open={open} onClose={() => dispatch?.close()} dialogClassName="dark">
            <div className="relative z-10 h-[591px] w-[calc(100%-40px)] max-w-[400px] overflow-hidden rounded-2xl bg-white dark:bg-black">
                {mounted ? <SwapModalContent props={props} open={open} onClose={() => dispatch?.close()} /> : null}
            </div>
        </Modal>
    );
}
