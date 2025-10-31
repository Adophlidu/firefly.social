'use client';

import { web3 } from '@coral-xyz/anchor';
import { delay } from '@firefly/utils';
import {
    type ConnectedWallet,
    type PrivyClientConfig,
    PrivyProvider,
    type SignMessageModalUIOptions,
    usePrivy,
    useSignMessage,
    useSyncJwtBasedAuthState,
    useWallets,
} from '@privy-io/react-auth';
import {
    ConnectedStandardSolanaWallet as ConnectedSolanaWallet,
    useSignAndSendTransaction as useSignAndSendTransactionSolana,
    useWallets as useSolanaWallets,
} from '@privy-io/react-auth/solana';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import bs58 from 'bs58';
import { first } from 'lodash-es';
import { createRef, type Ref, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { FireflyLoginRequired } from '@/components/FireflyLoginRequired.js';
import { chains } from '@/configs/chains.js';
import { NetworkType } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

type SignMessageWithEVM = (
    input: {
        message: string;
    },
    options?: {
        uiOptions?: SignMessageModalUIOptions;
        address?: string;
    },
) => Promise<{
    signature: string;
}>;

type SupportedSolanaTransaction = web3.Transaction | web3.VersionedTransaction;

type SendTransactionWithSolana = (o: {
    transaction: SupportedSolanaTransaction;
    connection: web3.Connection;
    address?: string;
}) => Promise<{
    signature: string;
}>;

type SignMessageWithSolana = (o: { message: Uint8Array }) => Promise<Uint8Array>;
type SignTransactionWithSolana = (o: {
    transaction: web3.Transaction | web3.VersionedTransaction;
    connection: web3.Connection;
    address?: string;
}) => Promise<Uint8Array>;

interface PrivyBridgeHandle {
    getWallets: () => {
        solanaWallets: ConnectedSolanaWallet[];
        evmWallets: ConnectedWallet[];
    };
    getAuthenticated: () => boolean;
    sendTransactionWithSolana: SendTransactionWithSolana;
    signTransactionWithSolana: SignTransactionWithSolana;
    signMessageWithSolana: SignMessageWithSolana;
    signAllTransactionsWithSolana: (txs: SupportedSolanaTransaction[]) => Promise<SupportedSolanaTransaction[]>;
    signMessageWithEVM: SignMessageWithEVM;
    isReady: boolean;
}

const PRIVY_SOLANA_CHAIN = 'solana:mainnet';

function PrivyBridge({ ref }: { ref: Ref<PrivyBridgeHandle> }) {
    const { wallets: evmWallets } = useWallets();
    const { wallets: solanaWallets } = useSolanaWallets();
    const { authenticated, ready } = usePrivy();
    const { signAndSendTransaction: signAndSendTransactionSolana } = useSignAndSendTransactionSolana();
    const { signMessage: signMessageWithEVM } = useSignMessage();

    useImperativeHandle(
        ref,
        () => ({
            isReady: ready,
            getWallets() {
                return {
                    evmWallets,
                    solanaWallets,
                };
            },
            getAuthenticated() {
                return authenticated;
            },
            signMessageWithEVM,
            async sendTransactionWithSolana({ transaction, connection }) {
                const wallet = first(solanaWallets);
                if (!wallet) throw new WalletNotConnectedError();
                const { signature } = await wallet.signAndSendTransaction({
                    transaction: new Uint8Array(
                        transaction.serialize({
                            requireAllSignatures: false,
                            verifySignatures: false,
                        }),
                    ),
                    chain: PRIVY_SOLANA_CHAIN,
                });
                return { signature: bs58.encode(signature) };
            },
            async signTransactionWithSolana({ transaction }) {
                const wallet = first(solanaWallets);
                if (!wallet) throw new WalletNotConnectedError();
                const { signedTransaction } = await wallet.signTransaction({
                    transaction: new Uint8Array(
                        transaction.serialize({
                            requireAllSignatures: false,
                            verifySignatures: false,
                        }),
                    ),
                });
                return signedTransaction;
            },
            async signMessageWithSolana({ message }) {
                const wallet = first(solanaWallets);
                if (!wallet) throw new WalletNotConnectedError();
                const { signedMessage } = await wallet.signMessage({ message });
                return signedMessage;
            },
            async signAllTransactionsWithSolana(txs) {
                const wallet = first(solanaWallets);
                if (!wallet) throw new WalletNotConnectedError();
                await signAndSendTransactionSolana(
                    ...txs.map((transaction) => ({
                        transaction: new Uint8Array(
                            transaction.serialize({
                                requireAllSignatures: false,
                                verifySignatures: false,
                            }),
                        ),
                        wallet,
                    })),
                );
                return txs;
            },
        }),
        [ready, signMessageWithEVM, evmWallets, solanaWallets, authenticated, signAndSendTransactionSolana],
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

interface PrivyRootHandle {
    setShowWalletUI: (show: boolean) => void;
}

function Root({ ref, rootRef }: { ref: Ref<PrivyBridgeHandle>; rootRef: Ref<PrivyRootHandle> }) {
    const [showWalletUI, setShowWalletUI] = useState(true);
    useImperativeHandle(
        rootRef,
        () => ({
            setShowWalletUI,
        }),
        [setShowWalletUI],
    );

    useEffect(() => {
        const handlePointerUp = (e: PointerEvent) => {
            runInSafe(() => {
                if (e.pointerType !== 'touch') return;
                const target = e.target as HTMLElement | null;
                if (!target) return;
                const clickable =
                    target.closest('#privy-modal-content') &&
                    (target.closest('button, a, [role="button"]') as HTMLElement | null);
                if (!clickable) return;
                const ariaDisabled = clickable.getAttribute('aria-disabled');
                const isDisabled = clickable.hasAttribute('disabled') || ariaDisabled === 'true';
                if (isDisabled) return;
                if (typeof clickable.click === 'function') {
                    clickable.click();
                }
            });
        };
        document.addEventListener('pointerup', handlePointerUp, { capture: true });
        return () => {
            document.removeEventListener('pointerup', handlePointerUp, { capture: true } as any);
        };
    }, []);

    return (
        <FireflyLoginRequired>
            <PrivyProvider
                appId={env.external.NEXT_PUBLIC_PRIVY_APP_ID}
                config={{
                    solana: {
                        rpcs: {
                            [PRIVY_SOLANA_CHAIN]: {
                                rpc: createSolanaRpc(env.external.NEXT_PUBLIC_SOLANA_RPC_URL),
                                rpcSubscriptions: createSolanaRpcSubscriptions(
                                    env.external.NEXT_PUBLIC_SOLANA_RPC_WS_URL,
                                ),
                            },
                        },
                    },
                    externalWallets: {
                        disableAllExternalWallets: true,
                    },
                    supportedChains: chains as unknown as PrivyClientConfig['supportedChains'],
                    embeddedWallets: {
                        showWalletUIs: showWalletUI,
                    },
                }}
            >
                <PrivyBridge ref={ref} />
            </PrivyProvider>
        </FireflyLoginRequired>
    );
}

export class PrivyBridgeElement
    extends HTMLElement
    implements PrivyBridgeHandle, Omit<PrivyRootHandle, 'setShowWalletUI'>
{
    private _reactRoot?: Root;
    private _ref = createRef<PrivyBridgeHandle>();
    private _rootRef = createRef<PrivyRootHandle>();

    connectedCallback() {
        if (!this._reactRoot) {
            this._reactRoot = createRoot(this);
            this._reactRoot.render(<Root ref={this._ref} rootRef={this._rootRef} />);
        }
    }

    disconnectedCallback() {
        this._reactRoot?.unmount();
        this._reactRoot = undefined;
    }

    get isReady() {
        return this._ref.current?.isReady ?? false;
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

    public signMessageWithEVM(...args: Parameters<PrivyBridgeHandle['signMessageWithEVM']>) {
        return this._ref.current!.signMessageWithEVM(...args);
    }

    public async setShowWalletUI(show: boolean) {
        this._rootRef.current?.setShowWalletUI(show);
        await delay(100); // wait for Privy to hide the UI
    }

    public reload() {
        this.disconnectedCallback();
        this.connectedCallback();
    }
}

customElements.define('privy-bridge', PrivyBridgeElement);
