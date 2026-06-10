import { type Ref, useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { dynamic } from '@/esm/dynamic.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { ShareImageModalOpenProps, ShareImageModalRefType } from '@/modals/ShareImageModal/refs.js';

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
        name: 'share-image-modal',
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
                <div className="relative w-[480px] max-w-[90vw] rounded-3xl bg-primaryBottom p-6 shadow-popover transition-all">
                    <ShareImageModalContent
                        imageUrl={props.imageUrl}
                        aspectRatio={props.aspectRatio}
                        fileName={props.fileName}
                        enableCopy={props.enableCopy}
                        onPost={props.onPost}
                        onClose={onClose}
                    />
                </div>
            </Modal>
        );
    }

    return (
        <Popover open={open} onClose={onClose} dialogPanelClassName="!p-0 !pt-6">
            <div className="px-3 pb-6 text-medium text-lightMain">
                <ShareImageModalContent
                    imageUrl={props.imageUrl}
                    aspectRatio={props.aspectRatio}
                    fileName={props.fileName}
                    enableCopy={props.enableCopy}
                    onPost={props.onPost}
                    onClose={onClose}
                />
            </div>
        </Popover>
    );
}
