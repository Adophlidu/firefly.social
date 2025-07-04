import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useState } from 'react';
import QRCode from 'react-qr-code';

import { ActionButton } from '@/components/ActionButton.js';
import { BackButton, CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { ReceiveChainItem, type ReceiveChainItemProps } from '@/components/ReceiveModal/ReceiveChainItem.js';
import { useCopyText } from '@/hooks/useCopyText.js';

interface Props {
    items: Array<Omit<ReceiveChainItemProps, 'onClickQrCodeButton'>>;
    open: boolean;
    onClose?: () => void;
}

export function ReceiveModal({ open, onClose, items }: Props) {
    const [selected, setSelected] = useState<{ name: ReactNode; address: string } | null>(null);
    return (
        <Modal open={open} onClose={() => onClose?.()} dialogClassName="z-50">
            <div className="z-50 flex min-h-[404px] w-[calc(100%-40px)] max-w-[480px] flex-col rounded-md bg-lightBottom pt-6 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:rounded-xl">
                <DialogTitle as="h3" className="relative h-10 shrink-0 px-6 pt-safe">
                    {selected ? (
                        <BackButton
                            onClick={() => setSelected(null)}
                            className="absolute left-6 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                        />
                    ) : (
                        <CloseButton
                            onClick={() => onClose?.()}
                            className="absolute left-6 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                        />
                    )}
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                        {selected ? <Trans>Your {selected.name} Address</Trans> : <Trans>Receive</Trans>}
                    </span>
                </DialogTitle>
                <AnimatePresence mode="wait" initial={false}>
                    {selected ? (
                        <motion.div
                            key="qrcode"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pb-6 pt-6 text-center"
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
                            className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto p-6 md:max-h-[416px]"
                        >
                            {items.map((item, i) => (
                                <ReceiveChainItem
                                    key={i}
                                    {...item}
                                    onClickQrCodeButton={() => {
                                        setSelected({ address: item.address, name: item.name });
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Modal>
    );
}

function CopyButton({ address }: { address: string }) {
    const [copied, handleCopy] = useCopyText(address);
    return (
        <ActionButton onClick={() => handleCopy()} className="h-10 !rounded-lg">
            {copied ? <Trans>Copied</Trans> : <Trans>Copy address</Trans>}
        </ActionButton>
    );
}
