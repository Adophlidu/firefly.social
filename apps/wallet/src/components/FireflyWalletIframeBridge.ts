import {
    IframeBridgeMethod,
    iframeBridgeProvider,
    type IframeBridgeRequestArguments,
    type IframeBridgeResponseResult,
    SolanaMethod,
    type SolanaRequestArguments,
    type SolanaResponse,
} from '@dimensiondev/iframe-bridge';
import { delay, unreachable } from '@dimensiondev/utils';
import { useSessionSigners, useSignMessage as useEthereumSignMessage, useWallets } from '@privy-io/react-auth';
import {
    type ConnectedStandardSolanaWallet,
    useSignMessage as useSolanaSignMessage,
    useWallets as useSolanaWallets,
} from '@privy-io/react-auth/solana';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { getWalletClient } from '@wagmi/core';
import bs58 from 'bs58';
import { useSetAtom } from 'jotai';
import { first } from 'lodash-es';
import { memo, useEffect, useRef } from 'react';
import { isHex, toHex } from 'viem';

import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import { SOLANA_MAINNET_PRIVY, SolanaChainId } from '@/constants/solana.js';
import { isRunningInIframe } from '@/helpers/isRunningInIframe.js';
import { resolveEvmConnector } from '@/helpers/resolveEvmConnector.js';
import {
    signAndBroadcastSolanaTransaction,
    signAndBroadcastSolanaTransactions,
} from '@/helpers/signAndBroadcastSolanaTransaction.js';
import { useWaitForPrivyLogin } from '@/hooks/useWaitForPrivyLogin.js';
import { logger } from '@/lib/Logger.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';

type FireflyWalletEvmRpcRequest = IframeBridgeRequestArguments[IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Privy's send flow falls back to mainnet when the tx omits chainId, even after a successful switch.
function withTransactionChainId(
    args: FireflyWalletEvmRpcRequest,
    chainId: number | undefined,
): FireflyWalletEvmRpcRequest {
    if (args.method !== 'eth_sendTransaction' || !chainId || !Array.isArray(args.params) || args.params.length === 0) {
        return args;
    }

    const [transaction, ...rest] = args.params;
    if (!isRecord(transaction) || 'chainId' in transaction) return args;

    return {
        ...args,
        params: [{ ...transaction, chainId: toHex(chainId) }, ...rest],
    };
}

export const FireflyWalletIframeBridge = memo(function IframeBridge() {
    const { wallets: evmWallets } = useWallets();
    const { wallets } = useSolanaWallets();
    const { signMessage: signEthereumMessage } = useEthereumSignMessage();
    const { signMessage: signSolanaMessage } = useSolanaSignMessage();
    const { addSessionSigners } = useSessionSigners();
    const wallet = first(wallets);
    const waitForPrivyLogin = useWaitForPrivyLogin();
    const solanaWalletRef = useRef<ConnectedStandardSolanaWallet>(wallet);
    const evmWalletsRef = useRef(evmWallets);
    const setShowEmbeddedWalletUI = useSetAtom(showEmbeddedWalletUIAtom);
    const navigate = useNavigate();
    const router = useRouter();

    useEffect(() => {
        solanaWalletRef.current = wallet;
    }, [wallet]);

    useEffect(() => {
        evmWalletsRef.current = evmWallets;
    }, [evmWallets]);

    const handlersRef = useRef({
        navigate,
        setShowEmbeddedWalletUI,
        addSessionSigners,
        signEthereumMessage,
        signSolanaMessage,
        waitForPrivyLogin,
    });

    useEffect(() => {
        handlersRef.current = {
            navigate,
            setShowEmbeddedWalletUI,
            addSessionSigners,
            signEthereumMessage,
            signSolanaMessage,
            waitForPrivyLogin,
        };
    }, [
        navigate,
        setShowEmbeddedWalletUI,
        addSessionSigners,
        signEthereumMessage,
        signSolanaMessage,
        waitForPrivyLogin,
    ]);

    useEffect(() => {
        if (!isRunningInIframe()) return;

        function ensureHomePage() {
            const currentPath = router.state.location.pathname;
            if (currentPath !== '/') {
                handlersRef.current.navigate({ to: '/', replace: true });
            }
        }

        const allEvents: {
            [K in IframeBridgeMethod]: (
                params: IframeBridgeRequestArguments[K],
            ) => Promise<IframeBridgeResponseResult[K]>;
        } = {
            [IframeBridgeMethod.MASKO_PLAY_ANIMATION]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.MASKO_SHOW_TEXT]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.COMPOSE]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.LOGIN]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.NAVIGATE]: async ({ path, replace }) => {
                const { navigate } = handlersRef.current;
                // Parse path and search params separately for TanStack Router
                const url = new URL(path, 'http://localhost');
                const pathname = url.pathname;
                const search = Object.fromEntries(url.searchParams.entries());
                if (replace) {
                    navigate({ to: pathname, search, replace: true });
                } else {
                    navigate({ to: pathname, search });
                }
            },
            [IframeBridgeMethod.ENQUEUE_MESSAGE]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.DOWNLOAD_APP]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.FIREFLY_WALLET_NOTIFY]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.FIREFLY_WALLET_REFRESH]: async () => {
                await queryClient.invalidateQueries();
            },
            [IframeBridgeMethod.ENABLE_SYNC_SESSION]: async () => {
                // Coordinated by the host app; nothing to do inside the wallet iframe.
            },
            [IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE]: async ({ path, replace }) => {
                logger.debug('[IframeBridge.FIREFLY_WALLET_NAVIGATE]', { path, replace });
                const { navigate } = handlersRef.current;
                // Parse path and search params separately for TanStack Router
                const url = new URL(path, 'http://localhost');
                const pathname = url.pathname;
                const search = Object.fromEntries(url.searchParams.entries());

                if (replace) {
                    navigate({ to: pathname, search, replace: true });
                } else {
                    navigate({ to: pathname, search });
                }
            },
            [IframeBridgeMethod.FIREFLY_WALLET_VISIBILITY]: async ({ visible }) => {
                handlersRef.current.setShowEmbeddedWalletUI(Boolean(visible));
            },
            [IframeBridgeMethod.FIREFLY_WALLET_AUTHORIZED]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.FIREFLY_WALLET_CLOSE]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.FIREFLY_WALLET_OPEN]: async () => {
                throw new Error('Not implemented');
            },
            [IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC]: async (args) => {
                ensureHomePage();
                await handlersRef.current.waitForPrivyLogin();
                const privyEvmWallet =
                    evmWalletsRef.current.find((w) => w.walletClientType === 'privy') ?? first(evmWalletsRef.current);
                const connector = privyEvmWallet ? await resolveEvmConnector(privyEvmWallet) : undefined;
                const walletClient = await getWalletClient(config, { connector: connector ?? undefined });

                switch (args.method) {
                    case 'wallet_switchEthereumChain': {
                        if (
                            Array.isArray(args.params) &&
                            args.params[0] &&
                            'chainId' in args.params[0] &&
                            isHex(args.params[0].chainId)
                        ) {
                            const chainIdHex = args.params[0].chainId;
                            await walletClient.switchChain({
                                id: Number.parseInt(chainIdHex, 16),
                            });
                        }
                        return null;
                    }
                    case 'eth_chainId': {
                        const chainId = await walletClient.getChainId();
                        return toHex(chainId);
                    }
                    default:
                        const requestArgs = withTransactionChainId(
                            args,
                            await walletClient.getChainId().catch(() => undefined),
                        );
                        return walletClient.request(requestArgs as never);
                }
            },
            [IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC]: async ({ method, params: p }): Promise<SolanaResponse> => {
                ensureHomePage();
                await handlersRef.current.waitForPrivyLogin();
                const wallet = solanaWalletRef.current!;
                switch (method) {
                    case SolanaMethod.SignMessage: {
                        const params = p as SolanaRequestArguments[SolanaMethod.SignMessage];
                        const { signature } = await wallet.signMessage({
                            message: bs58.decode(params.message),
                        });
                        return bs58.encode(signature) as never;
                    }
                    case SolanaMethod.SignAndSendTransaction: {
                        const params = p as SolanaRequestArguments[SolanaMethod.SignAndSendTransaction];
                        return (await signAndBroadcastSolanaTransaction(
                            wallet,
                            bs58.decode(params.transaction),
                        )) as never;
                    }
                    case SolanaMethod.SignAndSendAllTransactions: {
                        const params = p as SolanaRequestArguments[SolanaMethod.SignAndSendAllTransactions];
                        return (await signAndBroadcastSolanaTransactions(
                            wallet,
                            params.transactions.map((transaction) => bs58.decode(transaction)),
                        )) as never;
                    }
                    case SolanaMethod.SignTransaction: {
                        const params = p as SolanaRequestArguments[SolanaMethod.SignTransaction];
                        const { signedTransaction } = await wallet.signTransaction({
                            chain: SOLANA_MAINNET_PRIVY,
                            transaction: bs58.decode(params.transaction),
                        });
                        return bs58.encode(signedTransaction);
                    }
                    default:
                        unreachable(method);
                }
            },
            [IframeBridgeMethod.FIREFLY_WALLET_ADD_SESSION_SIGNER]: async ({ address, signers }) => {
                const { waitForPrivyLogin, addSessionSigners } = handlersRef.current;
                await waitForPrivyLogin();
                await addSessionSigners({
                    address,
                    signers,
                });
            },
            [IframeBridgeMethod.FIREFLY_WALLET_SIGN_MESSAGE]: async ({ chainId, address, message }) => {
                const { waitForPrivyLogin, signSolanaMessage, signEthereumMessage } = handlersRef.current;
                await waitForPrivyLogin();
                if (parseInt(chainId, 16) === SolanaChainId.Mainnet) {
                    const wallet = solanaWalletRef.current;
                    if (!wallet) throw new Error('No Solana wallet found');
                    const { signature } = await signSolanaMessage({
                        message: bs58.decode(message),
                        wallet,
                        options: {
                            uiOptions: {
                                showWalletUIs: false,
                            },
                        },
                    });
                    return bs58.encode(signature);
                }

                try {
                    const promise = signEthereumMessage(
                        { message },
                        {
                            address,
                            uiOptions: {
                                showWalletUIs: false,
                            },
                        },
                    );
                    const { signature } = await promise;
                    return signature;
                } catch (error) {
                    if ((error as Error)?.message === 'Unable to connect to wallet') {
                        await delay(1000 * 60);
                    }
                    throw error;
                }
            },
        };

        iframeBridgeProvider.onRequest(async (method, params) => {
            try {
                return await allEvents[method](params);
            } catch (error) {
                if (error instanceof Error && 'cause' in error && error.cause) {
                    throw error.cause;
                }
                throw error;
            }
        });

        return () => iframeBridgeProvider.destroy();
    }, []);

    return null;
});
