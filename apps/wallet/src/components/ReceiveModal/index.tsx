import LeftArrowIcon from '@dimensiondev/assets/left-arrow.svg';
import { Trans } from '@lingui/react/macro';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import QRCode from 'react-qr-code';

import { ActionButton } from '@/components/ActionButton.js';
import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
    DialogOrDrawerTopButton,
} from '@/components/DialogOrDrawer.js';
import { ReceiveChainItem, type ReceiveChainItemProps } from '@/components/ReceiveModal/ReceiveChainItem.js';
import { useCopyText } from '@/hooks/useCopyText.js';

interface Props {
    items: Array<Omit<ReceiveChainItemProps, 'onClickQrCodeButton'>>;
    open: boolean;
    loading?: boolean;
    onClose?: () => void;
}

function CopyButton({ address }: { address: string }) {
    const [copied, handleCopy] = useCopyText(address);
    return (
        <ActionButton onClick={() => handleCopy()} className="h-10 !rounded-lg">
            {copied ? <Trans>Copied</Trans> : <Trans>Copy address</Trans>}
        </ActionButton>
    );
}

function LoadingSkeleton() {
    return (
        <div className="w-full animate-pulse space-y-2">
            <div className="bg-lightBg h-16 w-full rounded-2xl" />
            <div className="bg-lightBg h-16 w-full rounded-2xl" />
            <div className="bg-lightBg h-16 w-full rounded-2xl" />
            <div className="bg-lightBg h-16 w-full rounded-2xl" />
            <div className="bg-lightBg h-16 w-full rounded-2xl" />
            <div className="bg-lightBg h-16 w-full rounded-2xl" />
            <div className="bg-lightBg h-16 w-full rounded-2xl" />
            <div className="bg-lightBg h-16 w-full rounded-2xl" />
            <div className="bg-lightBg h-16 w-full rounded-2xl" />
        </div>
    );
}

export function ReceiveModal({ open, items, loading, onClose }: Props) {
    const [chainId, setChainId] = useState<number | null>(null);
    const selected = items.find((x) => x.chainId === chainId);

    return (
        <DialogOrDrawer
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    onClose?.();
                }
            }}
        >
            <DialogOrDrawerContent className="md:h-[480px]">
                <DialogOrDrawerHeader closeButton={!selected}>
                    {selected ? (
                        <DialogOrDrawerTopButton Icon={LeftArrowIcon} alt="back" onClick={() => setChainId(null)} />
                    ) : null}
                    <DialogOrDrawerTitle>
                        {selected ? <Trans>Your {selected.name} Address</Trans> : <Trans>Receive</Trans>}
                    </DialogOrDrawerTitle>
                </DialogOrDrawerHeader>
                {loading ? (
                    <LoadingSkeleton />
                ) : (
                    <AnimatePresence mode="wait" initial={false}>
                        <div className="no-scrollbar h-[370px] overflow-y-auto">
                            {selected ? (
                                <motion.div
                                    key="qrcode"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="z-10 flex w-full flex-col items-center text-center"
                                >
                                    <div className="size-[270px] rounded-2xl bg-white p-4">
                                        <QRCode value={selected.address} size={238} />
                                    </div>
                                    <div className="mb-6 mt-4 w-full break-all text-sm font-medium leading-[18px]">
                                        {selected.address}
                                    </div>
                                    <div className="w-full">
                                        <CopyButton address={selected.address} />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="z-10 flex h-auto w-full flex-col space-y-2"
                                >
                                    {items.map((item, i) => (
                                        <ReceiveChainItem
                                            key={i}
                                            {...item}
                                            onClickQrCodeButton={() => {
                                                setChainId(item.chainId);
                                            }}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    </AnimatePresence>
                )}
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
