'use client';

import { exposeToIframe, type ReadyOptions } from '@farcaster/frame-host';
import { Trans } from '@lingui/react/macro';
import { EthereumMethodType } from '@masknet/web3-shared-evm';
import { useEffect, useRef, useState } from 'react';
import { useAsyncRetry } from 'react-use';
import { toHex } from 'viem';

import { FramePage, FramePageBody, FramePageTitle } from '@/app/(whiteboard)/components/FramePage.js';
import { GhostError } from '@/app/(whiteboard)/components/GhostError.js';
import FireflyLogo from '@/assets/firefly.logo.svg';
import { IS_DEVELOPMENT } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';
import { createEIP1193Provider } from '@/helpers/createEIP1193Provider.js';
import { createWagmiMockClient } from '@/helpers/createWagmiMockClient.js';
import { squashCallback } from '@/helpers/squashCallback.js';
import { useFireflyBridgeSupported } from '@/hooks/useFireflyBridgeSupported.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { FarcasterFrameHost } from '@/providers/frame/Host.js';
import { Network, SupportedMethod, type Transaction } from '@/types/bridge.js';
import type { RequestArguments } from '@/types/ethereum.js';
import type { FrameV2, FrameV2Host } from '@/types/frame.js';
import type { NextPageProps } from '@/types/index.js';

const connectWalletSquashed = squashCallback(
    () =>
        fireflyBridgeProvider.request(SupportedMethod.CONNECT_WALLET, {
            type: Network.EVM,
        }),
    {
        resolver: () => 'connect-wallet',
    },
);

interface Props extends NextPageProps {}

export default function Page(props: Props) {
    const [ready, setReady] = useState(false);

    const { loading: loadingSupported, value: supported = false } = useFireflyBridgeSupported();

    const { loading, error, value } = useAsyncRetry(async () => {
        if (!supported) return;

        const result = await fireflyBridgeProvider.request(SupportedMethod.GET_FRAME_CONTEXT, {});
        const context = {
            user: result.user,
            location: result.location,
            client: {
                clientFid: result.user.fid,
                added: false,
                ...result.client,
            },
        };

        console.log('DEBUG fetch frame context:', context);

        return {
            frame: {
                ...result.frame.content,
                x_url: result.frame.originalUrl,
                x_version: 2,
            },
            frameHost: new FarcasterFrameHost(context, {
                ready: (options?: Partial<ReadyOptions>) => {
                    if (options) {
                        fireflyBridgeProvider.request(SupportedMethod.SET_FRAME_READY_OPTIONS, options);
                    }
                    setReady(true);
                },
                close: () => fireflyBridgeProvider.request(SupportedMethod.CLOSE, {}),
                setPrimaryButton: (options) =>
                    fireflyBridgeProvider.request(SupportedMethod.SET_PRIMARY_BUTTON, options),
            }),
        } satisfies {
            frame: FrameV2;
            frameHost: FrameV2Host;
        };
    }, [supported]);

    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const { frame, frameHost } = value ?? {};

    useEffect(() => {
        if (!supported) return;
        if (!frameRef.current) return;
        if (!frameHost) return;

        console.log('DEBUG: expose to iframe');
        console.log({
            supported,
            current: frameRef.current,
            frameHost,
        });

        const result = exposeToIframe({
            debug: IS_DEVELOPMENT,
            iframe: frameRef.current,
            sdk: frameHost,
            ethProvider: createEIP1193Provider(async function request(requestArguments: RequestArguments) {
                const { method, params } = requestArguments;

                switch (method) {
                    case EthereumMethodType.ETH_REQUEST_ACCOUNTS: {
                        const accounts = await fireflyBridgeProvider.request(SupportedMethod.GET_WALLET_ADDRESS, {
                            type: Network.EVM,
                        });
                        if (accounts.length) return accounts;

                        const account = await connectWalletSquashed();
                        return [account];
                    }
                    case EthereumMethodType.ETH_SIGN: {
                        const [address, message] = params as [string, string];
                        return fireflyBridgeProvider.request(SupportedMethod.SIGN_MESSAGE, {
                            address,
                            message,
                        });
                    }
                    case EthereumMethodType.ETH_SIGN_TYPED_DATA: {
                        const [address, data] = params as [string, {}];
                        return fireflyBridgeProvider.request(SupportedMethod.SIGN_TYPED_DATA, {
                            address,
                            message: JSON.stringify(data),
                        });
                    }
                    case EthereumMethodType.ETH_SIGN_TRANSACTION: {
                        const client = await createWagmiMockClient();
                        const chainId = await client.getChainId();

                        const transaction = params[0] as Transaction;
                        return fireflyBridgeProvider.request(SupportedMethod.SIGN_TRANSACTION, {
                            chainId: toHex(chainId),
                            transaction,
                        });
                    }
                    case EthereumMethodType.ETH_SEND_TRANSACTION: {
                        const client = await createWagmiMockClient();
                        const chainId = await client.getChainId();

                        const transaction = params[0] as Transaction;
                        const rawTransaction = await fireflyBridgeProvider.request(SupportedMethod.SIGN_TRANSACTION, {
                            chainId: toHex(chainId),
                            transaction,
                        });
                        return client.sendRawTransaction({
                            serializedTransaction: rawTransaction as `0x${string}`,
                        });
                    }
                    default: {
                        const client = await createWagmiMockClient();
                        return client.request(requestArguments as Parameters<typeof client.request>[0]);
                    }
                }
            }),
            frameOrigin: '*',
        });

        return () => {
            result?.cleanup();
        };
    }, [supported, frame, frameHost]);

    const onReload = () => {
        bom.location?.reload();
    };

    const onClose = () => {
        if (supported) fireflyBridgeProvider.request(SupportedMethod.CLOSE, {});
        else bom.window?.close();
    };

    if ((!loadingSupported && !supported) || error) {
        return (
            <FramePage>
                <FramePageTitle frame={frame} onClose={onClose} onReload={onReload}>
                    Firefly
                </FramePageTitle>
                <FramePageBody>
                    <GhostError
                        error={error}
                        fallback={<Trans>Your browser does not support the Firefly Bridge.</Trans>}
                    />
                </FramePageBody>
            </FramePage>
        );
    }

    return (
        <FramePage>
            <FramePageTitle frame={frame} onClose={onClose} onReload={onReload}>
                {frame ? frame.button.action.name : <Trans>Loading...</Trans>}
            </FramePageTitle>
            <FramePageBody>
                {!ready || loading || loadingSupported ? (
                    <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center bg-white dark:bg-black">
                        <FireflyLogo width={80} height={80} />
                    </div>
                ) : null}
                {frame ? (
                    <iframe
                        className="scrollbar-hide absolute inset-0 z-0 h-full w-full opacity-100"
                        ref={frameRef}
                        src={frame.button.action.url}
                        allow="clipboard-write 'src'"
                        sandbox="allow-forms allow-scripts allow-same-origin"
                        style={{
                            backgroundColor: frame.button.action.splashBackgroundColor,
                        }}
                    />
                ) : (
                    <GhostError error={error} fallback={<Trans>No frame found.</Trans>} />
                )}
            </FramePageBody>
        </FramePage>
    );
}
