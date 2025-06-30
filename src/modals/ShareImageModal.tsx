import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface ShareImageModalOpenProps {
    imageUrl: string;
    aspectRatio?: string; // optimize CLS with this
}
type Props = {
    ref: React.Ref<SingletonModalRefCreator<ShareImageModalOpenProps>>;
};

export function ShareImageModal({ ref }: Props) {
    const [props, setProps] = useState<ShareImageModalOpenProps>();
    const [loading, setLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const isMedium = useIsMedium();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
            setLoading(true);
            setHasError(false);
        },
        onClose: () => {
            setProps(undefined);
        },
    });

    if (!props?.imageUrl) return null;

    const onClose = () => {
        dispatch?.close();
    };

    const modalContent = (
        <div>
            <div className="relative flex h-10 items-center justify-center">
                <CloseButton className="absolute left-0 top-1/2 -translate-y-1/2" onClick={onClose} />
                <span className="text-lg font-semibold text-main">
                    <Trans>Share image</Trans>
                </span>
            </div>
            <div className="no-scrollbar relative my-4 max-h-[50vh] overflow-y-auto">
                {loading || hasError ? (
                    <div className="absolute inset-0 z-1 flex items-center justify-center bg-primaryBottom">
                        {loading ? (
                            <LoadingIcon width={24} height={24} />
                        ) : hasError ? (
                            <span className="text-medium font-medium text-secondary">
                                <Trans>Failed to load image.</Trans>
                            </span>
                        ) : null}
                    </div>
                ) : null}
                <div
                    className="w-full"
                    style={{
                        aspectRatio: props.aspectRatio || '1 / 1',
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={props.imageUrl}
                        alt={'Share image'}
                        className="h-full w-full object-cover"
                        onLoad={() => {
                            setLoading(false);
                        }}
                        onError={() => {
                            setLoading(false);
                            setHasError(true);
                        }}
                    />
                </div>
            </div>
            <ClickableButton
                disabled={loading || hasError}
                className="h-10 w-full rounded-lg bg-main text-center text-medium font-bold text-primaryBottom"
                onClick={() => {
                    const a = document.createElement('a');
                    a.href = props.imageUrl;
                    a.target = '_blank';
                    a.download = 'firefly_tip_share.png';
                    a.click();
                }}
            >
                <Trans>Download image</Trans>
            </ClickableButton>
        </div>
    );

    if (isMedium) {
        return (
            <Modal open={open} onClose={onClose}>
                <div className="relative w-[480px] max-w-[90vw] rounded-3xl bg-primaryBottom p-6 shadow-popover transition-all">
                    {modalContent}
                </div>
            </Modal>
        );
    }

    return (
        <Popover open={open} onClose={onClose} dialogPanelClassName="!p-0 !pt-6">
            <div className="px-3 pb-6 text-medium text-lightMain">{modalContent}</div>
        </Popover>
    );
}
