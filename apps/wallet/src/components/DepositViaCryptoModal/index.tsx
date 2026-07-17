import CloseIcon from '@dimensiondev/assets/close.svg';
import SelectedIcon from '@dimensiondev/assets/selected.svg';
import { isSameAddress } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

import { ActionButton } from '@/components/ActionButton.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { DialogOrDrawer, DialogOrDrawerContent, DialogOrDrawerTitle } from '@/components/DialogOrDrawer.js';
import { Image } from '@/components/Image.js';
import { Spinner } from '@/components/ui/spinner.js';
import { splitAddressForHighlight } from '@/helpers/deposit/splitAddressForHighlight.js';
import { toastLoading } from '@/helpers/toastLoading.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import { useTronDepositStatusPolling } from '@/hooks/useTronDepositStatusPolling.js';
import { cn } from '@/lib/utils.js';
import type { DepositAllSupportedTokenItem } from '@/providers/types/Firefly.js';

export interface DepositChainOption {
    chainId: number;
    chainName: string;
    /** Explicit logo URL (e.g. Tron). When omitted ChainIcon resolves by chainId. */
    icon?: string;
}

interface Props {
    open: boolean;
    /** `loading` = checking account; `creating` = account being created; `ready` = QR view. */
    status: 'loading' | 'creating' | 'ready';
    chains: DepositChainOption[];
    selectedChainId: number | null;
    /** Tokens available on the selected chain, in API order. */
    tokens: DepositAllSupportedTokenItem[];
    selectedTokenAddress: string | null;
    /** Deposit address for the selected chain/token (Tron relay or proxy address). */
    address: string | null;
    /** Minimum deposit amount in USD for the selected token. */
    minDepositUsd: number;
    /** Tron exposes USDT only — disable the token selector. */
    isTron: boolean;
    onChangeChain: (chainId: number) => void;
    onChangeToken: (token: DepositAllSupportedTokenItem) => void;
    onClose: () => void;
}

function CopyButton({ address }: { address: string }) {
    const [copied, handleCopy] = useCopyText(address);
    return (
        <ActionButton onClick={() => handleCopy()} className="h-10 !rounded-lg text-[15px]">
            {copied ? <Trans>Copied</Trans> : <Trans>Copy address</Trans>}
        </ActionButton>
    );
}

function TokenLogo({ tokenIcon, symbol }: { tokenIcon?: string | null; symbol: string }) {
    return (
        <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border">
            {tokenIcon ? (
                <Image unoptimized src={tokenIcon} alt={symbol} className="size-full object-cover" />
            ) : (
                <span className="text-[10px] font-bold text-main">{symbol.slice(0, 3)}</span>
            )}
        </span>
    );
}

function QrTokenBadge({ tokenIcon, symbol }: { tokenIcon?: string | null; symbol: string }) {
    return (
        <div className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-white p-2">
            {tokenIcon ? (
                <Image unoptimized src={tokenIcon} alt={symbol} className="size-full rounded-full object-cover" />
            ) : (
                <span className="text-base font-bold text-main">{symbol.slice(0, 3)}</span>
            )}
        </div>
    );
}

interface SelectorCardProps {
    icon: React.ReactNode;
    title: string;
    disabled?: boolean;
    open: boolean;
    onToggle: () => void;
    children?: React.ReactNode;
}

function SelectorCard({ icon, title, disabled, open, onToggle, children }: SelectorCardProps) {
    return (
        <div className="relative min-w-0 flex-1">
            <button
                type="button"
                disabled={disabled}
                onClick={onToggle}
                className={cn(
                    'border-line2 flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition-colors',
                    disabled ? 'cursor-default' : 'hover:bg-lightBg',
                )}
            >
                <span className="flex min-w-0 items-center gap-2">
                    {icon}
                    <span className="truncate text-[14px] font-semibold leading-5 text-main">{title}</span>
                </span>
                {disabled ? null : (
                    <ChevronDown
                        size={12}
                        className={cn('shrink-0 text-secondary transition-transform', open && 'rotate-180')}
                    />
                )}
            </button>
            <AnimatePresence>{open ? children : null}</AnimatePresence>
        </div>
    );
}

function OptionMenu({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="no-scrollbar border-line2 absolute inset-x-0 top-full z-30 mt-1 max-h-[240px] overflow-y-auto rounded-xl border bg-primaryBottom shadow-[0_8px_64px_0_rgba(0,0,0,0.12)]"
        >
            {children}
        </motion.div>
    );
}

function ModalHeader({ onClose, className }: { onClose: () => void; className?: string }) {
    return (
        <div className={cn('flex items-center', className)}>
            <DialogOrDrawerTitle className="flex-1 text-left text-[18px] font-bold leading-[22px] text-main">
                <Trans>Deposit via Crypto Address</Trans>
            </DialogOrDrawerTitle>
            <button
                type="button"
                onClick={onClose}
                className="-mr-1 flex size-6 items-center justify-center rounded text-main outline-none hover:bg-lightBg"
                aria-label={t`Close`}
            >
                <CloseIcon className="size-6" />
            </button>
        </div>
    );
}

function CreatingView() {
    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Spinner className="size-16 text-main" />
            <div className="flex flex-col gap-2">
                <span className="text-[18px] font-semibold text-main">
                    <Trans>Account Creating</Trans>
                </span>
                <span className="text-sm font-normal leading-5 text-second">
                    <Trans>Your prediction account will be ready shortly.</Trans>
                </span>
            </div>
        </div>
    );
}

export function DepositViaCryptoModal({
    open,
    status,
    chains,
    selectedChainId,
    tokens,
    selectedTokenAddress,
    address,
    minDepositUsd,
    isTron,
    onChangeChain,
    onChangeToken,
    onClose,
}: Props) {
    const [openMenu, setOpenMenu] = useState<'chain' | 'token' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedChain = useMemo(
        () => chains.find((c) => c.chainId === selectedChainId) ?? null,
        [chains, selectedChainId],
    );
    const selectedToken = useMemo(
        () => tokens.find((token) => isSameAddress(token.token_address, selectedTokenAddress ?? undefined)) ?? null,
        [tokens, selectedTokenAddress],
    );

    const tronPollingAddress = isTron ? address : null;
    const { latestTransaction } = useTronDepositStatusPolling(open ? tronPollingAddress : null);

    // Toast-based deposit status tracking (Tron only).
    const toastId = useId();
    const notifiedStatusesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        notifiedStatusesRef.current = new Set();
    }, [tronPollingAddress]);

    useEffect(() => {
        const status = latestTransaction?.status;
        if (!status) return;

        // Fall back to a stable key before the bridge assigns tx_hash/created_time_ms,
        // so the "deposit detected" toast still fires during DEPOSIT_DETECTED.
        const txKey = latestTransaction.tx_hash ?? latestTransaction.created_time_ms?.toString() ?? 'pending';
        const txHash = latestTransaction.tx_hash;
        const notificationKey = `${txKey}:${status}`;
        if (notifiedStatusesRef.current.has(notificationKey)) return;
        notifiedStatusesRef.current.add(notificationKey);

        if (status === 'completed') {
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
        } else if (status === 'failed') {
            toast.error(t`Failed to deposit.`, { id: toastId });
        } else {
            // deposit_detected | processing | origin_tx_confirmed | submitted
            toastLoading(t`Deposit detected and processing...`, { id: toastId });
        }
    }, [latestTransaction, toastId]);

    useEffect(() => {
        if (!openMenu) return;

        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpenMenu(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenu]);

    const segments = address ? splitAddressForHighlight(address) : null;

    return (
        <DialogOrDrawer
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
        >
            <DialogOrDrawerContent className="h-full" bodyClassName="pb-0">
                {status === 'loading' ? (
                    <div className="flex w-full flex-col gap-6 pt-6">
                        <ModalHeader onClose={onClose} />
                        <div className="flex w-full justify-center py-16">
                            <Spinner className="size-8 text-main" />
                        </div>
                    </div>
                ) : status === 'creating' ? (
                    <div className="flex w-full flex-col gap-6 pt-6">
                        <ModalHeader onClose={onClose} />
                        <CreatingView />
                    </div>
                ) : (
                    <div ref={containerRef} className="box-border flex size-full flex-col gap-4 pt-6">
                        <ModalHeader onClose={onClose} className="shrink-0" />

                        <div className="flex justify-evenly gap-1.5">
                            <SelectorCard
                                icon={
                                    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border">
                                        <ChainIcon
                                            chainId={selectedChain?.chainId}
                                            icon={selectedChain?.icon}
                                            size={24}
                                            className="!rounded-none"
                                        />
                                    </span>
                                }
                                title={selectedChain?.chainName ?? ''}
                                open={openMenu === 'chain'}
                                onToggle={() => setOpenMenu(openMenu === 'chain' ? null : 'chain')}
                            >
                                <OptionMenu>
                                    {chains.map((chain) => (
                                        <button
                                            key={chain.chainId}
                                            type="button"
                                            className="flex w-full items-center gap-2 px-4 py-[11px]"
                                            onClick={() => {
                                                onChangeChain(chain.chainId);
                                                setOpenMenu(null);
                                            }}
                                        >
                                            <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full border">
                                                <ChainIcon
                                                    chainId={chain.chainId}
                                                    icon={chain.icon}
                                                    size={20}
                                                    className="!rounded-none"
                                                />
                                            </span>
                                            <span className="truncate text-sm font-semibold text-main">
                                                {chain.chainName}
                                            </span>
                                            {chain.chainId === selectedChainId ? (
                                                <SelectedIcon className="ml-auto size-5 text-main" />
                                            ) : null}
                                        </button>
                                    ))}
                                </OptionMenu>
                            </SelectorCard>

                            <SelectorCard
                                icon={
                                    <TokenLogo
                                        tokenIcon={selectedToken?.token_icon}
                                        symbol={selectedToken?.token_symbol ?? ''}
                                    />
                                }
                                title={selectedToken?.token_symbol ?? ''}
                                disabled={isTron}
                                open={openMenu === 'token'}
                                onToggle={() => setOpenMenu(openMenu === 'token' ? null : 'token')}
                            >
                                <OptionMenu>
                                    {tokens.map((token) => (
                                        <button
                                            key={token.token_address || token.token_symbol}
                                            type="button"
                                            className="flex w-full items-center gap-2 px-4 py-[11px]"
                                            onClick={() => {
                                                onChangeToken(token);
                                                setOpenMenu(null);
                                            }}
                                        >
                                            <TokenLogo tokenIcon={token.token_icon} symbol={token.token_symbol ?? ''} />
                                            <span className="truncate text-sm font-semibold text-main">
                                                {token.token_symbol}
                                            </span>
                                            {isSameAddress(token.token_address, selectedTokenAddress ?? undefined) ? (
                                                <SelectedIcon className="ml-auto size-5 text-main" />
                                            ) : null}
                                        </button>
                                    ))}
                                </OptionMenu>
                            </SelectorCard>
                        </div>

                        <div className="no-scrollbar flex min-h-0 grow flex-col gap-4 overflow-auto pb-6">
                            <p className="mx-4 text-center text-[16px] font-medium leading-5 text-second">
                                <Trans>
                                    No direct transfers from <span className="text-highlight">CEXs</span> and minimum{' '}
                                    <span className="text-highlight">${minDepositUsd}</span> required.
                                </Trans>
                            </p>

                            <div className="flex flex-col items-center gap-4">
                                <div className="relative size-[206px] rounded-2xl bg-white">
                                    {address ? <QRCode value={address} size={206} /> : null}
                                    <QrTokenBadge
                                        tokenIcon={selectedToken?.token_icon}
                                        symbol={selectedToken?.token_symbol ?? ''}
                                    />
                                </div>

                                {address ? (
                                    <p className="w-[270px] break-all text-center text-[14px] font-medium leading-[18px] text-main">
                                        {segments?.middle ? (
                                            <>
                                                <span className="text-highlight">{segments.head}</span>
                                                <span>{segments.middle}</span>
                                                <span className="text-highlight">{segments.tail}</span>
                                            </>
                                        ) : (
                                            <span className="text-highlight">{segments?.head ?? address}</span>
                                        )}
                                    </p>
                                ) : (
                                    <div className="h-[36px]" />
                                )}

                                <div className="w-full">
                                    {address ? (
                                        <CopyButton address={address} />
                                    ) : (
                                        <div className="flex h-10 items-center justify-center rounded-lg bg-lightBg">
                                            <Spinner className="size-4 text-second" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
