import { Trans } from '@lingui/react/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useState } from 'react';
import QRCode from 'react-qr-code';

import { ActionButton } from '@/components/ActionButton.js';
import {
    ReceiveChainItem,
    type ReceiveChainItemProps,
} from '@/components/FireflyWallet/ReceiveModal/ReceiveChainItem.js';
import { Modal } from '@/components/Modal.js';
import { classNames } from '@/helpers/classNames.js';
import { delay } from '@/helpers/delay.js';
import { useCopyText } from '@/hooks/useCopyText.js';

interface Props {
    items: Array<Omit<ReceiveChainItemProps, 'onClickQrCodeButton'>>;
    open: boolean;
    onClose?: () => void;
}

export function ReceiveModal({ open, onClose, items }: Props) {
    const [selected, setSelected] = useState<{ name: ReactNode; address: string } | null>(null);
    return (
        <Modal
            open={open}
            onClose={async () => {
                onClose?.();
                await delay(300);
                setSelected(null);
            }}
            enableBack={!!selected}
            onBack={() => setSelected(null)}
            enableClose={!selected}
            dialogClassName="z-50"
            className="w-[calc(100%-40px)] max-w-[480px]"
            panelClassName={classNames('overflow-y-auto duration-100', selected ? 'md:h-[392px]' : 'md:h-[416px]')}
            title={selected ? <Trans>Your {selected.name} Address</Trans> : <Trans>Receive</Trans>}
        >
            <AnimatePresence mode="wait" initial={false}>
                {selected ? (
                    <motion.div
                        key="qrcode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto text-center"
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
                        className="flex min-h-0 flex-1 flex-col space-y-2"
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
