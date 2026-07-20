import { APP_BASE_PATH } from '@dimensiondev/envs/wallet';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { chains } from '@dimensiondev/web3/chains';
import { isNativeTokenDebank } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { type Address, encodeFunctionData, parseUnits, toHex } from 'viem';

import { ChainIcon } from '@/components/ChainIcon.js';
import { Button } from '@/components/ui/button.js';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { usePrivyWallet } from '@/hooks/usePrivyWallet.js';
import { logger } from '@/lib/Logger.js';
import { getMultiChainTokensQuery } from '@/queries/firefly/multiChainTokens.js';

export default EthereumDevPage;
export function EthereumDevPage() {
    const { evmAddress } = usePrivyWallet();

    const form = useForm<{
        chainId: number;
        tokenId: string;
        to: string;
        amount: string;
    }>({
        defaultValues: {
            chainId: chains[0]?.id ?? 1,
            tokenId: '',
            to: '',
            amount: '',
        },
        mode: 'onChange',
    });
    const { register, handleSubmit, setValue, watch, formState } = form;
    const chainId = watch('chainId');
    const tokenId = watch('tokenId');
    const to = watch('to');
    const amount = watch('amount');

    const query = useQuery({
        ...getMultiChainTokensQuery(
            evmAddress ? [evmAddress] : [],
            chains.map((c) => c.id),
        ),
        enabled: !!evmAddress,
    });

    const tokens = useMemo(() => {
        const assets = query.data?.tokenAssets ?? [];
        return assets.map((asset) => formatTokenFromFireflyTokenAsset(asset));
    }, [query.data]);

    const chainTokens = useMemo(() => {
        return tokens.filter((t) => t.chainId === chainId);
    }, [tokens, chainId]);

    const selectedToken = useMemo(() => {
        return chainTokens.find((t) => t.id === tokenId);
    }, [chainTokens, tokenId]);

    const canSubmit = !!evmAddress && !!selectedToken && !!to && !!amount;

    const onSubmit = async () => {
        if (!selectedToken) return;

        try {
            const from = evmAddress;
            const native = isNativeTokenDebank({
                id: selectedToken.id,
                chainId: selectedToken.chainId,
            });
            const amountWei = parseUnits(amount, selectedToken.decimals);

            const tx = native
                ? {
                      from,
                      to,
                      value: toHex(amountWei),
                  }
                : {
                      from,
                      to: selectedToken.id,
                      value: toHex(0),
                      data: encodeFunctionData({
                          abi: [
                              {
                                  type: 'function',
                                  name: 'transfer',
                                  stateMutability: 'nonpayable',
                                  inputs: [
                                      { name: 'to', type: 'address' },
                                      { name: 'value', type: 'uint256' },
                                  ],
                                  outputs: [{ type: 'bool' }],
                              },
                          ] as const,
                          functionName: 'transfer',
                          args: [to as Address, amountWei],
                      }),
                  };

            await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC, {
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: toHex(selectedToken.chainId) }],
            });
            const currentChainId = await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC, {
                method: 'eth_chainId',
                params: [],
            });
            logger.info(
                `[onSubmit] chainId: ${typeof currentChainId === 'string' ? currentChainId : JSON.stringify(currentChainId)}`,
            );
            const result = await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC, {
                method: 'eth_sendTransaction',
                params: [tx],
            });
            logger.info(`[onSubmit] result: ${typeof result === 'string' ? result : JSON.stringify(result)}`);
        } catch (err) {
            alert(
                'Send failed (placeholder):\n' +
                    JSON.stringify({ error: err instanceof Error ? err.message : String(err) }, null, 2),
            );
        }
    };

    return (
        <div className="mx-auto w-full max-w-[720px] px-4 py-6">
            <h1 className="mb-4 text-lg font-semibold">EVM Transfer (Dev)</h1>

            {!evmAddress ? (
                <div className="mb-4 rounded-md bg-bg p-3 text-sm">Please log in via Privy and connect a wallet</div>
            ) : null}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-center gap-3">
                    <div className="w-20 shrink-0 text-sm">Chain</div>
                    <Select
                        value={toHex(chainId)}
                        onValueChange={(value) => setValue('chainId', Number.parseInt(value, 16))}
                    >
                        <SelectTrigger className="w-[220px]">
                            <div className="flex items-center">
                                <ChainIcon chainId={chainId} size={16} className="mr-2" />
                                <span className="text-sm">
                                    {chains.find((c) => c.id === chainId)?.name || 'Unknown'}
                                </span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="w-[240px]" viewPortClassName="py-2">
                            {chains.map((c) => (
                                <SelectItem key={c.id} value={toHex(c.id)} className="hover:bg-bg">
                                    <div className="flex items-center text-sm">
                                        <ChainIcon chainId={c.id} size={16} className="mr-2" />
                                        <span>{c.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-20 shrink-0 text-sm">Token</div>
                    <Select value={tokenId} onValueChange={(value) => setValue('tokenId', value)}>
                        <SelectTrigger className="w-[300px]">
                            {selectedToken ? (
                                <div className="flex items-center">
                                    <img
                                        src={selectedToken.logoUrl}
                                        alt={selectedToken.symbol}
                                        className="mr-2 size-4 rounded-full"
                                    />
                                    <span className="mr-2 text-sm">{selectedToken.symbol}</span>
                                    <span className="text-[11px] opacity-70">Balance: {selectedToken.amount}</span>
                                </div>
                            ) : (
                                <span className="text-sm opacity-70">Select a token</span>
                            )}
                        </SelectTrigger>
                        <SelectContent className="w-[340px]" viewPortClassName="py-2">
                            {query.isLoading ? (
                                <div className="px-3 py-2 text-xs opacity-70">Loading...</div>
                            ) : chainTokens.length ? (
                                chainTokens.map((t) => (
                                    <SelectItem key={`${t.chainId}-${t.id}`} value={t.id} className="hover:bg-bg">
                                        <div className="flex items-center">
                                            <img src={t.logoUrl} alt={t.symbol} className="mr-2 size-4 rounded-full" />
                                            <span className="mr-2 text-sm">{t.symbol}</span>
                                            <span className="text-[11px] opacity-70">Balance: {t.amount}</span>
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-xs opacity-70">
                                    No tokens on this chain or wallet not connected
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-20 shrink-0 text-sm">Recipient</div>
                    <input
                        {...register('to', { required: true })}
                        autoComplete="off"
                        placeholder="0x... or ENS"
                        className="flex-1 rounded-md bg-bg px-3 py-2 text-sm outline-none"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-20 shrink-0 text-sm">Amount</div>
                    <input
                        {...register('amount', { required: true })}
                        autoComplete="off"
                        placeholder="Enter amount"
                        inputMode="decimal"
                        className="flex-1 rounded-md bg-bg px-3 py-2 text-sm outline-none"
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={!canSubmit}>
                        {formState.isSubmitting ? 'Submitting' : 'Submit'}
                    </Button>
                </div>
            </form>

            <iframe
                src={`${typeof window !== 'undefined' ? window.location.origin : ''}${APP_BASE_PATH}`}
                className="h-[600px] w-full max-w-[500px] rounded-lg border border-line shadow-sm"
            />
        </div>
    );
}
