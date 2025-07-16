import { dynamic } from '@/esm/dynamic.js';
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
    return <SwapModalContent ref={ref} />;
}
