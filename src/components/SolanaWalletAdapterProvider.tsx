/* cspell:disable */

'use client';

import '@solana/wallet-adapter-react-ui/styles.css';

import { type Adapter } from '@solana/wallet-adapter-base';
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { compact } from 'lodash-es';
import { type PropsWithChildren, useEffect } from 'react';

import { particleAdapter, walletConnectAdapter } from '@/configs/solanaWallets.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { SOLANA_WALLET_CACHE_KEY } from '@/constants/index.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { isValidSolanaAddress } from '@/helpers/isValidSolanaAddress.js';
import { captureConnectWalletEvent } from '@/providers/telemetry/captureConnectWalletEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

const wallets: Adapter[] = compact([
    env.external.NEXT_PUBLIC_PARTICLE === STATUS.Enabled ? particleAdapter : null,
    walletConnectAdapter,
]);

export type SolanaWalletAdapterProviderProps = PropsWithChildren<{
    enableInsights?: boolean;
}>;

export function SolanaWalletAdapterProvider(props: SolanaWalletAdapterProviderProps) {
    return (
        <ConnectionProvider endpoint={getSolanaRPCUrl()}>
            <WalletProvider wallets={wallets} autoConnect localStorageKey={SOLANA_WALLET_CACHE_KEY}>
                <WalletModalProvider>
                    {props.children}
                    {props.enableInsights ? <Insights /> : null}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

function resolveEventId(name_: string) {
    const name = name_.toLowerCase();

    if (name.includes('phantom')) return EventId.CONNECT_WALLET_SUCCESS_PHANTOM;
    if (name.includes('okx')) return EventId.CONNECT_WALLET_SUCCESS_OKX;
    if (name.includes('firefly')) return EventId.CONNECT_WALLET_SUCCESS_PARTICLE;
    if (name.includes('wallet connect') || name.includes('walletconnect'))
        return EventId.CONNECT_WALLET_SUCCESS_WALLET_CONNECT;

    return EventId.CONNECT_WALLET_SUCCESS;
}

function Insights() {
    const wallet = useWallet();
    const walletAddress = wallet.publicKey?.toBase58();
    const walletName = wallet.wallet?.adapter.name.__brand__ ?? 'unknown';

    useEffect(() => {
        if (!isValidSolanaAddress(walletAddress)) return;

        captureConnectWalletEvent(resolveEventId(walletName), {
            name: walletName,
            solanaAddress: walletAddress,
        });
    }, [walletAddress, walletName]);

    return null;
}
