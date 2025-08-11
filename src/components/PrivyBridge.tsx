'use client';

import {
    type ConnectedSolanaWallet,
    type ConnectedWallet,
    type PrivyClientConfig,
    PrivyProvider,
    type SupportedSolanaTransaction,
    usePrivy,
    useSolanaWallets,
    useSyncJwtBasedAuthState,
    useWallets,
} from '@privy-io/react-auth';
import {
    useSendTransaction,
    type UseSendTransactionInterface,
    useSignMessage,
    type UseSignMessageInterface,
    useSignTransaction,
    type UseSignTransactionInterface,
} from '@privy-io/react-auth/solana';
import { createRef, type Ref, useCallback, useEffect, useImperativeHandle } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { FireflyLoginRequired } from '@/components/FireflyLoginRequired.js';
import { chains } from '@/configs/chains.js';
import { NetworkType } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface PrivyBridgeHandle {
    getWallets: () => {
        solanaWallets: ConnectedSolanaWallet[];
        evmWallets: ConnectedWallet[];
    };
    getAuthenticated: () => boolean;
    sendTransactionWithSolana: UseSendTransactionInterface['sendTransaction'];
    signTransactionWithSolana: UseSignTransactionInterface['signTransaction'];
    signMessageWithSolana: UseSignMessageInterface['signMessage'];
    signAllTransactionsWithSolana: (txs: SupportedSolanaTransaction[]) => Promise<SupportedSolanaTransaction[]>;
}

function PrivyBridge({ ref }: { ref: Ref<PrivyBridgeHandle> }) {
    const { wallets: evmWallets } = useWallets();
    const { wallets: solanaWallets } = useSolanaWallets();
    const { authenticated, ready } = usePrivy();
    const { sendTransaction: sendTransactionWithSolana } = useSendTransaction();
    const { signTransaction: signTransactionWithSolana } = useSignTransaction();
    const { signMessage: signMessageWithSolana } = useSignMessage();

    useImperativeHandle(
        ref,
        () => ({
            getWallets() {
                return {
                    evmWallets,
                    solanaWallets,
                };
            },
            getAuthenticated() {
                return authenticated;
            },
            sendTransactionWithSolana,
            signTransactionWithSolana,
            signMessageWithSolana,
            signAllTransactionsWithSolana(...args) {
                return solanaWallets?.[0]?.signAllTransactions(...args);
            },
        }),
        [
            authenticated,
            evmWallets,
            sendTransactionWithSolana,
            signMessageWithSolana,
            signTransactionWithSolana,
            solanaWallets,
        ],
    );
    const isLoginFirefly = useIsLoginFirefly();
    const subscribe = useCallback((onJwtAuthStateChange: () => void) => {
        return useFireflyProfileStore.subscribe(onJwtAuthStateChange);
    }, []);
    const getExternalJwt = useCallback(async () => {
        return fireflySessionHolder.session?.token;
    }, []);

    useEffect(() => {
        usePrivyWalletStore.getState().setReady(ready);
    }, [ready]);
    useEffect(() => {
        usePrivyWalletStore.getState().setReady(authenticated);
    }, [authenticated]);
    useEffect(() => {
        usePrivyWalletStore.getState().setWallet(NetworkType.Ethereum, evmWallets);
    }, [evmWallets]);
    useEffect(() => {
        usePrivyWalletStore.getState().setWallet(NetworkType.Solana, solanaWallets);
    }, [solanaWallets]);

    useSyncJwtBasedAuthState({
        getExternalJwt,
        subscribe,
        enabled: isLoginFirefly,
    });

    return null;
}

export class PrivyBridgeElement extends HTMLElement implements PrivyBridgeHandle {
    private _reactRoot?: Root;
    private _ref = createRef<PrivyBridgeHandle>();

    connectedCallback() {
        if (!this._reactRoot) {
            this._reactRoot = createRoot(this);
            this._reactRoot.render(
                <FireflyLoginRequired>
                    <PrivyProvider
                        appId={env.external.NEXT_PUBLIC_PRIVY_APP_ID}
                        config={{
                            supportedChains: chains as unknown as PrivyClientConfig['supportedChains'],
                        }}
                    >
                        <PrivyBridge ref={this._ref} />
                    </PrivyProvider>
                </FireflyLoginRequired>,
            );
        }
    }

    disconnectedCallback() {
        this._reactRoot?.unmount();
        this._reactRoot = undefined;
    }

    public getWallets() {
        return this._ref.current?.getWallets() ?? { evmWallets: [], solanaWallets: [] };
    }

    public getAuthenticated() {
        return this._ref.current?.getAuthenticated() ?? false;
    }

    public sendTransactionWithSolana(...args: Parameters<PrivyBridgeHandle['sendTransactionWithSolana']>) {
        return this._ref.current!.sendTransactionWithSolana(...args);
    }

    public signTransactionWithSolana(...args: Parameters<PrivyBridgeHandle['signTransactionWithSolana']>) {
        return this._ref.current!.signTransactionWithSolana(...args);
    }

    public signAllTransactionsWithSolana(...args: Parameters<PrivyBridgeHandle['signAllTransactionsWithSolana']>) {
        return this._ref.current!.signAllTransactionsWithSolana(...args);
    }

    public signMessageWithSolana(...args: Parameters<PrivyBridgeHandle['signMessageWithSolana']>) {
        return this._ref.current!.signMessageWithSolana(...args);
    }

    public reload() {
        this.disconnectedCallback();
        this.connectedCallback();
    }
}

customElements.define('privy-bridge', PrivyBridgeElement);
