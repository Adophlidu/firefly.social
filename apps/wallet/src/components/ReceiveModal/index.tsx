import LeftArrowIcon from '@dimensiondev/assets/left-arrow.svg';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

import { ActionButton } from '@/components/ActionButton.js';
import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
    DialogOrDrawerTopButton,
} from '@/components/DialogOrDrawer.js';
import { ReceiveChainItem, type ReceiveChainItemProps } from '@/components/ReceiveModal/ReceiveChainItem.js';
import { toastLoading } from '@/helpers/toastLoading.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import { useTronDepositStatusPolling } from '@/hooks/useTronDepositStatusPolling.js';

interface Props {
    items: ReceiveChainItemProps[];
    open: boolean;
    loading?: boolean;
    onClose?: () => void;
}

const TRON_DEPOSIT_MIN_USD_FALLBACK = 9;

function CopyButton({ address, className = 'h-10 !rounded-lg' }: { address: string; className?: string }) {
    const [copied, handleCopy] = useCopyText(address);
    return (
        <ActionButton onClick={() => handleCopy()} className={className}>
            {copied ? <Trans>Copied</Trans> : <Trans>Copy address</Trans>}
        </ActionButton>
    );
}

function TokenIconBadge({ tokenIcon }: { tokenIcon?: string | null }) {
    return (
        <div className="absolute inset-0 m-auto flex size-16 items-center justify-center bg-white p-2 text-xl font-bold text-white">
            <div className="size-full rounded-full bg-[#50AF95]">
                {tokenIcon ? <img src={tokenIcon} alt="USDT" className="relative size-full rounded-full" /> : null}
            </div>
        </div>
    );
}

function TronDepositQRCode({ item }: { item: ReceiveChainItemProps }) {
    const minDepositUsd = item.minDepositUsd ?? TRON_DEPOSIT_MIN_USD_FALLBACK;

    return (
        <motion.div
            key="tron-qrcode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="z-10 flex w-full flex-col items-center text-center"
        >
            <p className="mb-6 w-full break-words text-left text-base font-medium leading-5 text-second">
                <Trans>
                    Send only <span className="text-highlight">USDT</span> via the Tron network to this address. Minimum{' '}
                    <span className="text-highlight">${minDepositUsd}</span> required.
                </Trans>
            </p>
            <div className="relative size-[270px] rounded-2xl bg-white p-4">
                <QRCode value={item.address} size={238} />
                <TokenIconBadge tokenIcon={item.tokenIcon} />
            </div>
            <div className="my-4 w-full break-all text-sm font-medium leading-[18px] text-main">{item.address}</div>
            <div className="w-full">
                <CopyButton address={item.address} />
            </div>
        </motion.div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="w-full animate-pulse space-y-2">
            <div className="h-16 w-full rounded-2xl bg-lightBg" />
            <div className="h-16 w-full rounded-2xl bg-lightBg" />
            <div className="h-16 w-full rounded-2xl bg-lightBg" />
            <div className="h-16 w-full rounded-2xl bg-lightBg" />
            <div className="h-16 w-full rounded-2xl bg-lightBg" />
            <div className="h-16 w-full rounded-2xl bg-lightBg" />
            <div className="h-16 w-full rounded-2xl bg-lightBg" />
            <div className="h-16 w-full rounded-2xl bg-lightBg" />
            <div className="h-16 w-full rounded-2xl bg-lightBg" />
        </div>
    );
}

export function ReceiveModal({ open, items, loading, onClose }: Props) {
    const [chainId, setChainId] = useState<number | null>(null);
    const selected = items.find((x) => x.chainId === chainId);
    const selectedTronAddress = selected?.variant === 'tron-deposit' ? selected.address : null;
    const { latestTransaction } = useTronDepositStatusPolling(open ? selectedTronAddress : null);

    // Toast-based deposit status tracking
    const toastId = useId();
    const notifiedStatusesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        notifiedStatusesRef.current = new Set();
    }, [selectedTronAddress]);

    useEffect(() => {
        if (!latestTransaction?.status) return;

        const txKey = latestTransaction.tx_hash ?? latestTransaction.created_time_ms?.toString();
        if (!txKey) return;

        const status = latestTransaction.status;
        const notificationKey = `${txKey}:${status}`;
        if (notifiedStatusesRef.current.has(notificationKey)) return;

        const txHash = latestTransaction.tx_hash;

        if (status === 'deposit_detected' || status === 'processing') {
            notifiedStatusesRef.current.add(notificationKey);
            toastLoading(t`Deposit detected and processing...`, { id: toastId });
        } else if (status === 'completed') {
            notifiedStatusesRef.current.add(notificationKey);
            toast.success(t`Your deposit has been credited to your account.`, {
                id: toastId,
                ...(txHash
                    ? {
                          action: {
                              label: t`View`,
                              onClick: () => window.open(`https://tronscan.org/#/transaction/${txHash}`, '_blank'),
                          },
                      }
                    : {}),
            });
        } else if (status === 'failed' || status === 'fail') {
            notifiedStatusesRef.current.add(notificationKey);
            toast.error(t`Failed to deposit.`, { id: toastId });
        }
    }, [latestTransaction, toastId]);

    return (
        <DialogOrDrawer
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    onClose?.();
                }
            }}
        >
            <DialogOrDrawerContent className={selected?.variant === 'tron-deposit' ? 'md:h-[600px]' : 'md:h-[480px]'}>
                <DialogOrDrawerHeader closeButton={!selected}>
                    {selected ? (
                        <DialogOrDrawerTopButton Icon={LeftArrowIcon} alt="back" onClick={() => setChainId(null)} />
                    ) : null}
                    <DialogOrDrawerTitle>
                        {selected?.variant === 'tron-deposit' ? (
                            <Trans>Your Tron(TRC-20) Address</Trans>
                        ) : selected ? (
                            <Trans>Your {selected.name} Address</Trans>
                        ) : (
                            <Trans>Receive</Trans>
                        )}
                    </DialogOrDrawerTitle>
                </DialogOrDrawerHeader>
                {loading ? (
                    <LoadingSkeleton />
                ) : (
                    <AnimatePresence mode="wait" initial={false}>
                        <div
                            className={
                                selected?.variant === 'tron-deposit'
                                    ? 'no-scrollbar h-[490px] overflow-y-auto'
                                    : 'no-scrollbar h-[370px] overflow-y-auto'
                            }
                        >
                            {selected ? (
                                selected.variant === 'tron-deposit' ? (
                                    <TronDepositQRCode item={selected} />
                                ) : (
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
                                        <div className="my-2 w-full break-all text-sm font-medium leading-[18px]">
                                            {selected.address}
                                        </div>
                                        <div className="w-full">
                                            <CopyButton address={selected.address} />
                                        </div>
                                    </motion.div>
                                )
                            ) : (
                                <motion.div
                                    key="list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="z-10 flex h-auto w-full flex-col gap-2"
                                >
                                    {items.map((item) => (
                                        <ReceiveChainItem
                                            key={`${item.chainId}:${item.address}`}
                                            {...item}
                                            onClickQrCodeButton={() => {
                                                if (item.onClickQrCodeButton) {
                                                    item.onClickQrCodeButton();
                                                    return;
                                                }
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
