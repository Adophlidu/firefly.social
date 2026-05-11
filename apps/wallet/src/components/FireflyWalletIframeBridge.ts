import { web3 } from '@coral-xyz/anchor';
import {
    IframeBridgeMethod,
    iframeBridgeProvider,
    type IframeBridgeRequestArguments,
    type IframeBridgeResponseResult,
    SolanaMethod,
    type SolanaRequestArguments,
    type SolanaResponse,
} from '@dimensiondev/iframe-bridge';
import { delay, NotImplementedError, unreachable } from '@dimensiondev/utils';
import { solana } from '@dimensiondev/web3/chains';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { getWalletClient } from '@wagmi/core';
import bs58 from 'bs58';
import { useSetAtom } from 'jotai';
import { memo, useEffect, useRef } from 'react';
import { type Address, isHex, toHex } from 'viem';
import { useConnectors, useSignMessage } from 'wagmi';

import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import { privySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { PRIVY_CONNECTOR_ID } from '@/constants/static.js';
import { decodeFreeGasTxType } from '@/helpers/freeGas/decodeFreeGasTxType.js';
import { tryFreeGasTransaction } from '@/helpers/freeGas/tryFreeGasTransaction.js';
import { isRunningInIframe } from '@/helpers/isRunningInIframe.js';
import { resolveEvmConnector } from '@/helpers/resolveEvmConnector.js';
import {
    signAndBroadcastSolanaTransaction,
    signAndBroadcastSolanaTransactions,
} from '@/helpers/signAndBroadcastSolanaTransaction.js';
import { usePrivyWallet } from '@/hooks/usePrivyWallet.js';
import { useWaitForPrivyLogin } from '@/hooks/useWaitForPrivyLogin.js';
import { logger } from '@/lib/Logger.js';
import { evmRpcRequestContextAtom, showEmbeddedWalletUIAtom, skipPinCodeAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';

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
    const { evmAddress } = usePrivyWallet();
    const evmAddressRef = useRef(evmAddress);

    const { mutateAsync: signEthereumMessage } = useSignMessage();
    const connectors = useConnectors();
    const connectorsRef = useRef(connectors);
    const waitForPrivyLogin = useWaitForPrivyLogin();
    const setShowEmbeddedWalletUI = useSetAtom(showEmbeddedWalletUIAtom);
    const setSkipAuth = useSetAtom(skipPinCodeAtom);
    const navigate = useNavigate();
    const router = useRouter();
    const pathnameRef = useRef(router.state.location.pathname);

    useEffect(() => {
        evmAddressRef.current = evmAddress;
    }, [evmAddress]);
    useEffect(() => {
        connectorsRef.current = connectors;
    }, [connectors]);
    useEffect(() => {
        pathnameRef.current = router.state.location.pathname;
    }, [router.state.location.pathname]);

    const handlersRef = useRef({
        navigate,
        setShowEmbeddedWalletUI,
        signEthereumMessage,
        waitForPrivyLogin,
        setSkipAuth,
    });

    useEffect(() => {
        handlersRef.current = {
            navigate,
            setShowEmbeddedWalletUI,
            signEthereumMessage,
            waitForPrivyLogin,
            setSkipAuth,
        };
    }, [navigate, setShowEmbeddedWalletUI, signEthereumMessage, waitForPrivyLogin, setSkipAuth]);

    useEffect(() => {
        if (!isRunningInIframe()) return;

        function ensureHomePage() {
            const currentPath = pathnameRef.current;
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
            [IframeBridgeMethod.FIREFLY_WALLET_SKIP_WALLET_AUTH]: async ({ skip }) => {
                handlersRef.current.setSkipAuth(Boolean(skip));
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
                const privyEvmWallet = evmAddressRef.current;
                const connector = privyEvmWallet
                    ? await resolveEvmConnector(privyEvmWallet, PRIVY_CONNECTOR_ID)
                    : undefined;
                const walletClient = await getWalletClient(config, { connector: connector ?? undefined });

                store.set(evmRpcRequestContextAtom, {
                    requestOrigin: args.requestOrigin,
                });

                try {
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
                        default: {
                            const currentChainId = await walletClient.getChainId().catch(() => undefined);
                            const { requestOrigin: _omit, ...rpcPayload } = args;
                            const requestArgs = withTransactionChainId(
                                rpcPayload as FireflyWalletEvmRpcRequest,
                                currentChainId,
                            );

                            // Try free-gas for known calldata types (ERC20 transfer / approve)
                            if (args.method === 'eth_sendTransaction' && Array.isArray(args.params) && args.params[0]) {
                                const tx = args.params[0] as Record<string, unknown>;
                                const data = typeof tx.data === 'string' ? tx.data : undefined;
                                const txType = decodeFreeGasTxType(data);

                                if (txType !== null) {
                                    try {
                                        const from =
                                            typeof tx.from === 'string' ? (tx.from as `0x${string}`) : undefined;
                                        const to = typeof tx.to === 'string' ? (tx.to as `0x${string}`) : undefined;
                                        const value = typeof tx.value === 'string' ? tx.value : undefined;
                                        const chainId = currentChainId;

                                        if (from && to && data && chainId) {
                                            const result = await tryFreeGasTransaction({
                                                chainId,
                                                txType,
                                                from,
                                                to,
                                                data: data as `0x${string}`,
                                                value,
                                            });
                                            if (result.type === 'free-gas') return result.hash as never;
                                        }
                                    } catch {
                                        logger.debug(
                                            '[IframeBridge] free-gas attempt failed, falling back to walletClient',
                                        );
                                    }
                                }
                            }

                            // free-gas attempt failed or not eligible — signal parent to open wallet for signing
                            iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_OPEN, {});
                            return walletClient.request(requestArgs as never);
                        }
                    }
                } finally {
                    store.set(evmRpcRequestContextAtom, null);
                }
            },
            [IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC]: async ({ method, params: p }): Promise<SolanaResponse> => {
                ensureHomePage();
                await handlersRef.current.waitForPrivyLogin();

                switch (method) {
                    case SolanaMethod.SignMessage: {
                        const params = p as SolanaRequestArguments[SolanaMethod.SignMessage];
                        const signature = await privySolanaProvider.signMessage(bs58.decode(params.message));
                        return bs58.encode(signature) as never;
                    }
                    case SolanaMethod.SignAndSendTransaction: {
                        const params = p as SolanaRequestArguments[SolanaMethod.SignAndSendTransaction];
                        const txBytes = bs58.decode(params.transaction);
                        const transaction = web3.VersionedTransaction.deserialize(txBytes);
                        return (await signAndBroadcastSolanaTransaction(privySolanaProvider, transaction)) as never;
                    }
                    case SolanaMethod.SignAndSendAllTransactions: {
                        const params = p as SolanaRequestArguments[SolanaMethod.SignAndSendAllTransactions];
                        return (await signAndBroadcastSolanaTransactions(
                            privySolanaProvider,
                            params.transactions.map((transaction) => {
                                const txBytes = bs58.decode(transaction);
                                return web3.VersionedTransaction.deserialize(txBytes);
                            }),
                        )) as never;
                    }
                    case SolanaMethod.SignTransaction: {
                        const params = p as SolanaRequestArguments[SolanaMethod.SignTransaction];
                        const txBytes = bs58.decode(params.transaction);
                        const transaction = web3.VersionedTransaction.deserialize(txBytes);
                        const signedTransaction = await privySolanaProvider.signTransaction(transaction);
                        return bs58.encode(signedTransaction.signatures[0]);
                    }
                    default:
                        unreachable(method);
                }
            },
            [IframeBridgeMethod.FIREFLY_WALLET_ADD_SESSION_SIGNER]: async ({ address, signers }) => {
                throw new NotImplementedError('Adding session signers is currently not supported in the iframe bridge');
            },
            [IframeBridgeMethod.FIREFLY_WALLET_SIGN_MESSAGE]: async ({ chainId, address, message }) => {
                const { waitForPrivyLogin, signEthereumMessage } = handlersRef.current;
                await waitForPrivyLogin();
                if (parseInt(chainId, 16) === solana.id) {
                    const signature = await privySolanaProvider.signMessage(bs58.decode(message));
                    return bs58.encode(signature);
                }

                try {
                    const promise = signEthereumMessage({
                        message,
                        account: address as Address,
                        connector: connectorsRef.current.find((c) => c.id === PRIVY_CONNECTOR_ID),
                    });
                    const signature = await promise;
                    return signature;
                } catch (error) {
                    if ((error as Error)?.message === 'Unable to connect to wallet') {
                        await delay(1000 * 60);
                    }
                    throw error;
                }
            },
        };

        const cleanupOnRequest = iframeBridgeProvider.onRequest(async (method, params) => {
            try {
                return await allEvents[method](params);
            } catch (error) {
                if (error instanceof Error && 'cause' in error && error.cause) {
                    throw error.cause;
                }
                throw error;
            }
        });

        return () => {
            cleanupOnRequest();
            iframeBridgeProvider.destroy();
        };
    }, []);

    return null;
});
