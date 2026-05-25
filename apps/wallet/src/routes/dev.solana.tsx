import { web3 } from '@coral-xyz/anchor';
import { APP_BASE_PATH } from '@dimensiondev/envs/wallet';
import {
    IframeBridgeMethod,
    iframeBridgeProvider,
    SolanaMethod,
    type SolanaResponse,
} from '@dimensiondev/iframe-bridge';
import { solana } from '@dimensiondev/web3/chains';
import { useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import bs58 from 'bs58';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button.js';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { logger } from '@/lib/Logger.js';
import { SolanaTransfer } from '@/providers/solana/Transfer.js';
import { getMultiChainTokensQuery } from '@/queries/firefly/multiChainTokens.js';

export const Route = createFileRoute('/dev/solana')({
    component: SolanaDevPage,
});

function SolanaDevPage() {
    const { walletProvider } = useAppKitProvider<Provider>('solana');
    const solAddress = walletProvider?.publicKey?.toString() || '';

    const form = useForm<{ tokenId: string; to: string; amount: string }>({
        defaultValues: { tokenId: '', to: '', amount: '' },
        mode: 'onChange',
    });
    const { register, handleSubmit, setValue, watch, formState } = form;
    const tokenId = watch('tokenId');
    const to = watch('to');
    const amount = watch('amount');

    const query = useQuery({
        ...getMultiChainTokensQuery(solAddress ? [solAddress] : [], [solana.id]),
        enabled: !!solAddress,
    });

    const tokens = useMemo(() => {
        const assets = query.data?.tokenAssets ?? [];
        return assets.map((asset) => formatTokenFromFireflyTokenAsset(asset)).filter((t) => t.chainId === solana.id);
    }, [query.data]);

    const selectedToken = useMemo(() => tokens.find((t) => t.id === tokenId), [tokens, tokenId]);
    const canSubmit = !!solAddress && !!selectedToken && !!to && !!amount;

    const onSubmit = async () => {
        if (!selectedToken || !walletProvider) return;

        try {
            const transfer = new SolanaTransfer(walletProvider);
            const transaction = await transfer.getTransferTransaction({
                amount,
                to,
                token: selectedToken,
            });
            const latestBlockhash = await transfer.connection.getLatestBlockhash();
            transaction.recentBlockhash = latestBlockhash.blockhash;
            transaction.feePayer = new web3.PublicKey(solAddress);

            const raw = transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
            });
            const result = (await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC, {
                method: SolanaMethod.SignAndSendTransaction,
                params: {
                    transaction: bs58.encode(raw),
                },
            })) as SolanaResponse<SolanaMethod.SignAndSendTransaction>;
            logger.info(result);
            alert(`Submitted. Signature: ${result}`);
        } catch (err) {
            alert(
                'Send failed (placeholder):\n' +
                    JSON.stringify({ error: err instanceof Error ? err.message : String(err) }, null, 2),
            );
        }
    };

    return (
        <div className="mx-auto w-full max-w-[720px] px-4 py-6">
            <h1 className="mb-4 text-lg font-semibold">Solana Transfer (Dev)</h1>

            {!solAddress ? (
                <div className="mb-4 rounded-md bg-bg p-3 text-sm">
                    Please log in via Privy and connect a Solana wallet
                </div>
            ) : null}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
                            ) : tokens.length ? (
                                tokens.map((t) => (
                                    <SelectItem key={`${t.chainId}-${t.id}`} value={t.id} className="hover:bg-bg">
                                        <div className="flex items-center">
                                            <img src={t.logoUrl} alt={t.symbol} className="mr-2 size-4 rounded-full" />
                                            <span className="mr-2 text-sm">{t.symbol}</span>
                                            <span className="text-[11px] opacity-70">Balance: {t.amount}</span>
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-xs opacity-70">No tokens or wallet not connected</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-20 shrink-0 text-sm">Recipient</div>
                    <input
                        {...register('to', { required: true })}
                        autoComplete="off"
                        placeholder="Solana address (base58)"
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
