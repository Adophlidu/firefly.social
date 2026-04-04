import { type Ref, useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { dynamic } from '@/esm/dynamic.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { type ShareImageModalOpenProps, type ShareImageModalRefType } from '@/modals/ShareImageModal/refs.js';

let aspectRatio = '1 / 1';
const ShareImageModalContent = dynamic(
    () => import('@/modals/ShareImageModal/ShareImageModalContent.js').then((m) => m.ShareImageModalContent),
    {
        ssr: false,
        loading: () => (
            <div className="w-full py-14">
                <div className="w-full" style={{ aspectRatio }}>
                    <Loading minHeight="100%" />
                </div>
            </div>
        ),
    },
);

interface Props {
    ref: Ref<ShareImageModalRefType>;
}

export function ShareImageModal({ ref }: Props) {
    const [props, setProps] = useState<ShareImageModalOpenProps>();
    const isMedium = useIsMedium();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            aspectRatio = props.aspectRatio || '1 / 1';
            setProps(props);
        },
        onClose: () => {
            setProps(undefined);
        },
    });

    if (!props?.imageUrl) return null;

    const onClose = () => {
        dispatch?.close();
    };

    if (isMedium) {
        return (
            <Modal open={open} onClose={onClose}>
                <div className="bg-primaryBottom shadow-popover relative w-[480px] max-w-[90vw] rounded-3xl p-6 transition-all">
                    <ShareImageModalContent
                        imageUrl={props.imageUrl}
                        aspectRatio={props.aspectRatio}
                        onClose={onClose}
                    />
                </div>
            </Modal>
        );
    }

    return (
        <Popover open={open} onClose={onClose} dialogPanelClassName="!p-0 !pt-6">
            <div className="text-medium text-lightMain px-3 pb-6">
                <ShareImageModalContent imageUrl={props.imageUrl} aspectRatio={props.aspectRatio} onClose={onClose} />
            </div>
        </Popover>
    );
}
