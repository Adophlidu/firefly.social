import { delay } from '@dimensiondev/utils';
import { getChainName } from '@dimensiondev/web3/chains';
import { ETH_ZERO_ADDRESS } from '@dimensiondev/web3/constants';
import { multipliedBy } from '@dimensiondev/web3/numbers';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useQuery } from '@tanstack/react-query';
import { Pencil, X } from 'lucide-react';
import { type ChangeEvent, type ReactNode, useCallback, useMemo, useState } from 'react';
import { createCallable } from 'react-call';
import { toast } from 'sonner';
import { type Address, erc20Abi, formatEther, formatUnits, type Hex, isAddress, parseUnits } from 'viem';
import { getPublicClient, readContract } from 'wagmi/actions';

import { ChainIcon } from '@/components/ChainIcon.js';
import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { Skeleton } from '@/components/Skeleton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Switch } from '@/components/ui/switch.js';
import { config } from '@/configs/wagmiClient.js';
import {
    applyAmountToTypedDataSession,
    type Eip2612PermitSession,
    encodeErc20ApproveCalldata,
    isDisplayUnlimitedAllowance,
    type Permit2SingleSession,
    type TokenApprovalSession,
    unlimitedApprovalAmount,
} from '@/helpers/evm/tokenApprovalSession.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { formatTokenAmount, parseInputAmount } from '@/helpers/swap/formatSwapAmount.js';
import { coinGeckoEndpoint } from '@/providers/coingecko/index.js';

export type TokenApproveFlowModalResult =
    | { accepted: false }
    | { accepted: true; kind: 'erc20Approve'; calldata: Hex }
    | { accepted: true; kind: 'eip2612Permit' | 'permit2Single'; typedDataJson: string };

export interface TokenApproveFlowModalProps {
    hide?: boolean;
    session: TokenApprovalSession;
    walletAddress: string;
    chainId: number;
    requestOrigin?: string | null;
    /** Original tx fields for gas estimation (ERC20 approve only) */
    txBase?: Record<string, unknown>;
}

function shortAddress(addr: string): string {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex w-full items-center justify-between gap-2">
            <span className="text-second shrink-0 text-[13px] leading-[18px]">{label}</span>
            <div className="text-main min-w-0 text-right text-[13px] font-medium leading-[18px]">{children}</div>
        </div>
    );
}

export const TokenApproveFlowModal = createCallable<TokenApproveFlowModalProps, TokenApproveFlowModalResult>(
    function TokenApproveFlowModalComponent({ call, hide, session, walletAddress, chainId, requestOrigin, txBase }) {
        const [open, setOpen] = useState(true);
        const [view, setView] = useState<'summary' | 'custom'>('summary');
        const [amount, setAmount] = useState(() => session.amount);

        const kind = session.kind;
        const tokenAddress = session.tokenAddress;

        const { data: tokenMeta, isLoading: metaLoading } = useQuery({
            queryKey: ['tokenApproveMeta', chainId, tokenAddress],
            staleTime: Infinity,
            queryFn: async () => {
                if (!isAddress(tokenAddress)) return { symbol: '?', decimals: 18 };
                const [symbol, decimals] = await Promise.all([
                    readContract(config, {
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'symbol',
                        chainId,
                    }).catch(() => '?'),
                    readContract(config, {
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'decimals',
                        chainId,
                    }).catch(() => 18),
                ]);
                return { symbol: String(symbol), decimals: Number(decimals) };
            },
        });

        const symbol = tokenMeta?.symbol ?? '…';
        const decimals = tokenMeta?.decimals ?? 18;

        const calldataForDraft = useMemo(() => {
            if (session.kind !== 'erc20Approve') return undefined;
            return encodeErc20ApproveCalldata(session.spender, amount);
        }, [session, amount]);

        const isErc20Approve = session.kind === 'erc20Approve';
        const { data: gasWeiCost, isLoading: gasLoading } = useQuery({
            queryKey: ['tokenApproveGas', chainId, walletAddress, tokenAddress, calldataForDraft, txBase],
            enabled:
                open &&
                view === 'summary' &&
                isErc20Approve &&
                !!calldataForDraft &&
                isAddress(walletAddress) &&
                isAddress(tokenAddress),
            queryFn: async () => {
                const client = getPublicClient(config, { chainId });
                if (!client) return null;
                const valueHex = txBase?.value;
                const value = typeof valueHex === 'string' && valueHex.startsWith('0x') ? BigInt(valueHex) : 0n;
                const gas = await client.estimateGas({
                    account: walletAddress as Address,
                    to: tokenAddress,
                    data: calldataForDraft as Hex,
                    value,
                });
                const fees = await client.estimateFeesPerGas().catch(() => null);
                if (fees?.maxFeePerGas) return gas * fees.maxFeePerGas;
                const gasPrice = await client.getGasPrice().catch(() => null);
                if (!gasPrice) return null;
                return gas * gasPrice;
            },
        });

        const { data: nativeTokenPrice, isLoading: priceLoading } = useQuery({
            queryKey: ['fungible', 'token-price', chainId, ETH_ZERO_ADDRESS],
            enabled: open && view === 'summary' && isErc20Approve,
            queryFn: () => coinGeckoEndpoint.getFungibleTokenPrice(chainId, ETH_ZERO_ADDRESS),
        });

        const gasUsdLabel = useMemo(() => {
            if (!gasWeiCost || !nativeTokenPrice) return null;
            const usd = multipliedBy(nativeTokenPrice, formatEther(gasWeiCost)).toString();
            return formatTokenUSD(usd, { minDisplay: 0.01 });
        }, [gasWeiCost, nativeTokenPrice]);

        const approveDisplay = useMemo(() => {
            if (isDisplayUnlimitedAllowance(amount, kind)) {
                return (
                    <span className="inline-flex items-center gap-1">
                        <Trans>Unlimited</Trans> {symbol}
                    </span>
                );
            }
            const human = formatTokenAmount(formatUnits(amount, decimals));
            return (
                <span className="inline-flex items-center gap-1">
                    {human} {symbol}
                </span>
            );
        }, [amount, decimals, kind, symbol]);

        const finishReject = useCallback(async () => {
            setOpen(false);
            await delay(300);
            call.end({ accepted: false });
        }, [call]);

        const finishAccept = useCallback(async () => {
            setOpen(false);
            await delay(300);
            if (session.kind === 'erc20Approve') {
                call.end({
                    accepted: true,
                    kind: 'erc20Approve',
                    calldata: encodeErc20ApproveCalldata(session.spender, amount),
                });
                return;
            }
            const typed =
                session.kind === 'eip2612Permit'
                    ? (session as Eip2612PermitSession)
                    : (session as Permit2SingleSession);
            call.end({
                accepted: true,
                kind: session.kind,
                typedDataJson: applyAmountToTypedDataSession(typed, amount),
            });
        }, [call, session, amount]);

        const [customUnlimited, setCustomUnlimited] = useState(() => isDisplayUnlimitedAllowance(session.amount, kind));
        const [customInput, setCustomInput] = useState(() =>
            isDisplayUnlimitedAllowance(session.amount, kind) ? '' : formatUnits(session.amount, decimals),
        );

        const openCustom = useCallback(() => {
            setCustomUnlimited(isDisplayUnlimitedAllowance(amount, kind));
            setCustomInput(isDisplayUnlimitedAllowance(amount, kind) ? '' : formatUnits(amount, decimals));
            setView('custom');
        }, [amount, decimals, kind]);

        const saveCustom = useCallback(() => {
            if (customUnlimited) {
                setAmount(unlimitedApprovalAmount(kind));
            } else {
                try {
                    const trimmed = customInput.trim();
                    if (!trimmed) {
                        toast.error(t`Enter an amount`);
                        return;
                    }
                    setAmount(parseUnits(trimmed, decimals));
                } catch {
                    toast.error(t`Invalid amount`);
                    return;
                }
            }
            setView('summary');
        }, [customInput, customUnlimited, decimals, kind]);

        const handleAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
            const parsed = parseInputAmount(e.target.value);
            setCustomInput(parsed);
        }, []);

        const headerTitle = view === 'summary' ? t`Review` : t`Custom Allowance`;
        const onHeaderClose = useCallback(async () => {
            if (view === 'summary') {
                await finishReject();
            } else {
                setView('summary');
            }
        }, [view, finishReject]);

        const saveDisabled = useMemo(() => {
            if (metaLoading) return true;
            if (customUnlimited) return false;

            try {
                const trimmed = customInput.trim();
                if (!trimmed) return true;
                parseUnits(trimmed, decimals);
                return false;
            } catch {
                return true;
            }
        }, [metaLoading, customUnlimited, customInput, decimals]);

        return (
            <DialogOrDrawer
                open={hide ?? open}
                onClose={() => {
                    void finishReject();
                }}
            >
                <DialogOrDrawerContent
                    className="z-[999999998] !m-0 max-h-[90vh] w-full max-w-md overflow-y-auto"
                    bodyClassName="!p-6"
                >
                    <VisuallyHidden asChild>
                        <DialogOrDrawerHeader>
                            <DialogOrDrawerTitle>{headerTitle}</DialogOrDrawerTitle>
                        </DialogOrDrawerHeader>
                    </VisuallyHidden>

                    <div className="flex flex-col gap-6">
                        <div className="flex w-full items-center justify-between gap-2">
                            <h2 className="text-main flex-1 font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-[18px] font-bold leading-[22px]">
                                {headerTitle}
                            </h2>
                            <button
                                type="button"
                                className="text-main flex size-6 shrink-0 items-center justify-center"
                                onClick={() => {
                                    void onHeaderClose();
                                }}
                                aria-label={t`Close`}
                            >
                                <X className="size-[15px]" />
                            </button>
                        </div>

                        {view === 'summary' ? (
                            <>
                                <div className="border-secondaryLine flex w-full flex-col gap-3 rounded-2xl border p-3">
                                    <SummaryRow label={t`Wallet`}>
                                        <span>{shortAddress(walletAddress)}</span>
                                    </SummaryRow>
                                    <SummaryRow label={t`Approve`}>
                                        {metaLoading ? (
                                            <Skeleton className="ml-auto h-[18px] w-[120px]" />
                                        ) : (
                                            <button
                                                type="button"
                                                className="inline-flex max-w-full items-center gap-1"
                                                onClick={openCustom}
                                            >
                                                <span className="truncate">{approveDisplay}</span>
                                                <Pencil className="text-main size-4 shrink-0" aria-hidden />
                                            </button>
                                        )}
                                    </SummaryRow>
                                    {isErc20Approve ? (
                                        <SummaryRow label={t`Network Fee`}>
                                            {gasLoading || priceLoading ? (
                                                <Skeleton className="ml-auto h-[18px] w-[80px]" />
                                            ) : (
                                                (gasUsdLabel ?? '--')
                                            )}
                                        </SummaryRow>
                                    ) : null}
                                    {requestOrigin ? (
                                        <SummaryRow label={t`Domain`}>
                                            <span className="break-all">{requestOrigin}</span>
                                        </SummaryRow>
                                    ) : null}
                                    <SummaryRow label={t`Chain`}>
                                        <div className="flex items-center justify-end gap-1">
                                            <ChainIcon chainId={chainId} size={13} className="shrink-0" />
                                            <span>{getChainName(chainId)}</span>
                                        </div>
                                    </SummaryRow>
                                </div>
                                <Button
                                    type="button"
                                    variant="primary"
                                    rounded
                                    disabled={metaLoading}
                                    className="h-10 w-full font-bold"
                                    onClick={() => {
                                        void finishAccept();
                                    }}
                                >
                                    <Trans>Confirm</Trans>
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="flex w-full flex-col gap-3">
                                    <div className="flex h-10 items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-1">
                                            {metaLoading ? (
                                                <>
                                                    <Skeleton className="size-9 shrink-0 rounded-full" />
                                                    <Skeleton className="h-6 w-16" />
                                                </>
                                            ) : (
                                                <>
                                                    <TokenIcon
                                                        size={36}
                                                        badgeSize={14}
                                                        chainId={chainId}
                                                        symbol={symbol}
                                                        className="shrink-0"
                                                    />
                                                    <span className="text-main text-[20px] font-semibold leading-6">
                                                        {symbol}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {metaLoading ? (
                                            <Skeleton className="h-6 w-24" />
                                        ) : customUnlimited ? (
                                            <span className="text-second text-[20px] font-semibold leading-5">
                                                <Trans>Unlimited</Trans>
                                            </span>
                                        ) : (
                                            <Input
                                                value={customInput}
                                                onChange={handleAmountChange}
                                                placeholder="0"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                className="text-main caret-highlight placeholder:text-second/60 min-w-0 flex-1 border-none bg-transparent text-right text-[20px] font-semibold leading-6 outline-none focus:border-none focus:outline-none"
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-second text-[13px] leading-6">
                                            <Trans>Unlimited Amount</Trans>
                                        </span>
                                        <Switch
                                            checked={customUnlimited}
                                            onCheckedChange={setCustomUnlimited}
                                            disabled={metaLoading}
                                            className="data-[state=checked]:bg-highlight h-[22px] w-[44px] data-[state=unchecked]:bg-[#B7B7B7]/50 [&>span]:size-[14px] data-[state=checked]:[&>span]:translate-x-[26px] data-[state=unchecked]:[&>span]:translate-x-1"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="primary"
                                    rounded
                                    disabled={saveDisabled}
                                    className="h-10 w-full font-bold"
                                    onClick={saveCustom}
                                >
                                    <Trans>Save</Trans>
                                </Button>
                            </>
                        )}
                    </div>
                </DialogOrDrawerContent>
            </DialogOrDrawer>
        );
    },
);
