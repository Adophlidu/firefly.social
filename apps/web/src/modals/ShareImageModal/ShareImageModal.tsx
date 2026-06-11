import { classNames } from '@dimensiondev/utils';
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
            <div className="w-full px-5 py-14">
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

function isPortraitRatio(aspectRatio?: string) {
    if (!aspectRatio) return false;
    const [width, height] = aspectRatio.split('/').map((part) => Number.parseFloat(part));
    if (!width || !height) return false;
    return width / height < 1;
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
                <div
                    className={classNames(
                        'relative max-w-[90vw] rounded-2xl bg-primaryBottom shadow-popover transition-all',
                        isPortraitRatio(props.aspectRatio) ? 'w-[300px]' : 'w-[480px]',
                    )}
                >
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
        <Popover open={open} onClose={onClose} enableOverflow={false} dialogPanelClassName="!p-0">
            <ShareImageModalContent
                imageUrl={props.imageUrl}
                aspectRatio={props.aspectRatio}
                fileName={props.fileName}
                enableCopy={props.enableCopy}
                onPost={props.onPost}
                onClose={onClose}
            />
        </Popover>
    );
}
