'use client';

import { exposeToIframe, type ReadyOptions } from '@farcaster/miniapp-host';
import { Trans } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { useAsyncRetry } from 'react-use';
import { toHex } from 'viem';

import { FramePage, FramePageBody, FramePageTitle } from '@/app/(whiteboard)/components/FramePage.js';
import { GhostError } from '@/app/(whiteboard)/components/GhostError.js';
import FireflyLogo from '@/assets/firefly.logo.svg';
import { Image } from '@/components/Image.js';
import { IS_IOS } from '@/constants/browser.js';
import { EIP6963_PROVIDER_DESCRIPTION, IS_DEVELOPMENT } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';
import { createEIP1193Provider } from '@/helpers/createEIP1193Provider.js';
import { createWagmiLimitedClient } from '@/helpers/createWagmiLimitedClient.js';
import { eip5792Polyfill } from '@/helpers/eip5792Polyfill.js';
import { frameSwapToken } from '@/helpers/frameSwapToken.js';
import { squashCallback } from '@/helpers/squashCallback.js';
import { waitForWebviewDidLoadEvent } from '@/helpers/waitForWebviewDidLoadEvent.js';
import { useFireflyBridgeSupported } from '@/hooks/useFireflyBridgeSupported.js';
import {
    RelayConfirmationPopover,
    RelayConfirmationPopoverRef,
} from '@/modals/FrameViewerModal/RelayConfirmationPopover.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { FarcasterFrameHost } from '@/providers/frame/Host.js';
import { Network, SupportedMethod, type Transaction } from '@/types/bridge.js';
import type { RequestArguments } from '@/types/ethereum.js';
import type { FrameV2 } from '@/types/frame.js';
import type { NextPageProps } from '@/types/utility.js';
import { EthereumMethodType } from '@/web3-shared/evm/types.js';

const connectWalletSquashed = squashCallback(
    () =>
        fireflyBridgeProvider.request(SupportedMethod.CONNECT_WALLET, {
            type: Network.EVM,
        }),
    {
        resolver: () => 'connect-wallet',
    },
);

const ethProvider = createEIP1193Provider(
    eip5792Polyfill(async function request(requestArguments: RequestArguments) {
        const { method, params } = requestArguments;

        const client = await createWagmiLimitedClient();
        const chainId = await client.getChainId();

        switch (method) {
            case EthereumMethodType.ETH_ACCOUNTS:
            case EthereumMethodType.ETH_REQUEST_ACCOUNTS: {
                const accounts = await fireflyBridgeProvider.request(SupportedMethod.GET_WALLET_ADDRESS, {
                    type: Network.EVM,
                });
                if (accounts.length) return accounts;

                const account = await connectWalletSquashed();
                return [account];
            }
            case EthereumMethodType.ETH_SIGN:
            case EthereumMethodType.PERSONAL_SIGN: {
                const [message, address] = params as [string, string];
                const signed = await fireflyBridgeProvider.request(SupportedMethod.SIGN_MESSAGE, {
                    chainId: toHex(chainId),
                    address,
                    message,
                });
                return signed;
            }
            case EthereumMethodType.ETH_SIGN_TYPED_DATA: {
                const [address, data] = params as [string, {} | string];
                const signed = await fireflyBridgeProvider.request(SupportedMethod.SIGN_TYPED_DATA, {
                    chainId: toHex(chainId),
                    address,
                    message: typeof data === 'string' ? data : JSON.stringify(data),
                });
                return signed;
            }
            case EthereumMethodType.ETH_SIGN_TRANSACTION: {
                const transaction = params[0] as Transaction;
                const hash = await fireflyBridgeProvider.request(SupportedMethod.SIGN_TRANSACTION, {
                    chainId: toHex(chainId),
                    transaction,
                });
                return hash;
            }
            case EthereumMethodType.ETH_SEND_TRANSACTION: {
                const transaction = params[0] as Transaction;
                const hash = await fireflyBridgeProvider.request(SupportedMethod.SEND_TRANSACTION, {
                    chainId: toHex(chainId),
                    transaction,
                });
                return hash;
            }
            default: {
                return client.request(requestArguments as Parameters<typeof client.request>[0]);
            }
        }
    }),
);

interface Props extends NextPageProps {}

export default function Page(props: Props) {
    const [ready, setReady] = useState(false);
    const endpointRef = useRef<ReturnType<typeof exposeToIframe>['endpoint']>(null);

    const { loading: loadingSupported, value: supported = false } = useFireflyBridgeSupported();

    const { loading, error, value } = useAsyncRetry(async () => {
        if (!supported) return;

        console.log('[frame client] supported', supported);

        // iOS needs to wait for the load event to be able to communicate with the bridge
        if (IS_IOS) {
            await waitForWebviewDidLoadEvent();
            console.log('[frame client] load event');
        }

        const result = await fireflyBridgeProvider.request(SupportedMethod.GET_FRAME_CONTEXT, {});
        console.log('[frame client] context', JSON.stringify(result));

        if (!result.user) throw new Error('No user found in frame context');

        const context = {
            user: result.user,
            location: result.location,
            client: {
                clientFid: result.user.fid,
                added: false,
                ...result.client,
            },
        };

        const frame = {
            ...result.frame.content,
            x_url: result.frame.originalUrl,
            x_version: 2,
        } satisfies FrameV2;

        const frameHost = new FarcasterFrameHost(context, {
            frame: () => frame,
            ready: (options?: Partial<ReadyOptions>) => {
                console.log('[frame client] ready', JSON.stringify(options));

                if (options) fireflyBridgeProvider.request(SupportedMethod.SET_FRAME_READY_OPTIONS, options);
                setReady(true);
            },
            close: () => fireflyBridgeProvider.request(SupportedMethod.CLOSE, {}),
            signIn: async (options) => {
                console.log('[frame client] signIn options', JSON.stringify(options));
                const signature = await RelayConfirmationPopoverRef.openAndWaitForClose({
                    fid: context.client.clientFid,
                    frame,
                    options,
                });
                console.log('[frame client] signIn result', JSON.stringify(signature));
                return signature;
            },
            setPrimaryButton: (options) => {
                console.log('[frame client] setPrimaryButton', JSON.stringify(options));
                fireflyBridgeProvider.request(SupportedMethod.SET_PRIMARY_BUTTON, options);
            },
            eip6963RequestProvider: () => {
                endpointRef.current?.emit({
                    event: 'eip6963:announceProvider',
                    info: EIP6963_PROVIDER_DESCRIPTION,
                });
            },
            swapToken: frameSwapToken,
        });

        return {
            frame,
            frameHost,
        };
    }, [supported]);

    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const { frame, frameHost } = value ?? {};

    useEffect(() => {
        if (!supported) return;
        if (!frameRef.current) return;
        if (!frameHost) return;

        const result = exposeToIframe({
            debug: IS_DEVELOPMENT,
            iframe: frameRef.current,
            sdk: frameHost,
            ethProvider,
            miniAppOrigin: '*',
        });

        // set endpoint for later use
        endpointRef.current = result.endpoint;

        return () => {
            result?.cleanup();
            endpointRef.current = null;
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
                    <div className="absolute inset-0 z-10 flex size-full items-center justify-center bg-white dark:bg-black">
                        {frame?.button.action.splashImageUrl ? (
                            <Image
                                alt={frame.button.action.name}
                                src={frame.button.action.splashImageUrl}
                                width={80}
                                height={80}
                            />
                        ) : (
                            <FireflyLogo width={80} height={80} />
                        )}
                    </div>
                ) : null}
                {frame ? (
                    <iframe
                        className="no-scrollbar absolute inset-0 z-0 size-full opacity-100"
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
            <RelayConfirmationPopover ref={RelayConfirmationPopoverRef.register} />
        </FramePage>
    );
}
