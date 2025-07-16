import { useState } from 'react';

import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { SwapModalOpenProps } from '@/modals/SwapModal/SwapModalContent.js';

const SwapModalContent = dynamic(
    () => import('@/modals/SwapModal/SwapModalContent.js').then((m) => m.SwapModalContent),
    {
        ssr: false,
        loading: () => null,
    },
);

type Props = {
    ref: React.Ref<SingletonModalRefCreator<SwapModalOpenProps>>;
};

export function SwapModal({ ref }: Props) {
    const [props, setProps] = useState<SwapModalOpenProps>();
    const [open, dispatch, mounted] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
    });

    if (!mounted) return null;

    return <SwapModalContent open={open} props={props} onClose={() => dispatch?.close()} />;
}
