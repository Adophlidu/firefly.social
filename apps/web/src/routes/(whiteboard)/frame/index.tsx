
import FireflyLogo from '@dimensiondev/assets/firefly.logo.svg';
import { IS_DEVELOPMENT } from '@dimensiondev/constants';
import { EIP6963_PROVIDER_DESCRIPTION } from '@dimensiondev/constants/static';
import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';
import type { LayoutProps } from '@dimensiondev/types';
import { bom, parseUrl } from '@dimensiondev/utils';
import { EthereumMethodType } from '@dimensiondev/web3/enums';
import { exposeToIframe, type MiniAppHost, type ReadyOptions } from '@farcaster/miniapp-host';
import { Trans } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { useAsyncRetry } from 'react-use';

import { FramePage, FramePageBody, FramePageTitle } from '@/app/[locale]/(whiteboard)/components/FramePage.js';
import { GhostError } from '@/app/[locale]/(whiteboard)/components/GhostError.js';
import { frameSwapToken } from '@/components/Frame/V2/frameSwapToken.js';
import { Image } from '@/components/Image.js';
import { ProfileVerifyBadge } from '@/components/ProfileVerifyBadge/index.js';
import { IS_IOS } from '@/constants/browser.js';
import { createEIP1193Provider } from '@/helpers/createEIP1193Provider.js';
import { createFireflyWalletClient } from '@/helpers/createFireflyWalletClient.js';
import { eip5792Polyfill } from '@/helpers/eip5792Polyfill.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { waitForWebviewDidLoadEvent } from '@/helpers/waitForWebviewDidLoadEvent.js';
import { useFrameAuthor } from '@/hooks/frame/useFrameAuthor.js';
import { useFireflyBridgeSupported } from '@/hooks/useFireflyBridgeSupported.js';
import { logger } from '@/libs/Logger.js';
import {
    RelayConfirmationPopover,
    RelayConfirmationPopoverRef,
} from '@/modals/FrameViewerModal/RelayConfirmationPopover.js';
import { FarcasterFrameHost } from '@/providers/frame/Host.js';
import type { RequestArguments } from '@/types/ethereum.js';
import type { FrameV2 } from '@/types/frame.js';

const ethProvider = createEIP1193Provider(
    eip5792Polyfill(async (requestArguments: RequestArguments) => {
        const client = await createFireflyWalletClient();
        return client.request(requestArguments as Parameters<typeof client.request>[0]);
    }),
);

interface Props extends LayoutProps {}

export default function Page(props: Props) {
    const [ready, setReady] = useState(false);
    const endpointRef = useRef<ReturnType<typeof exposeToIframe>['endpoint']>(null);

    const { isLoading: loadingSupported, data: supported = false } = useFireflyBridgeSupported();

    const { loading, error, value } = useAsyncRetry(async () => {
        if (!supported) return;

        logger.info('[frame client] supported', supported);

        // iOS needs to wait for the load event to be able to communicate with the bridge
        if (IS_IOS) {
            await waitForWebviewDidLoadEvent();
            logger.info('[frame client] load event');
        }

        const result = await nativeBridgeProvider.request(SupportedMethod.GET_FRAME_CONTEXT, {});
        logger.info('[frame client] context', JSON.stringify(result));

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
        } as FrameV2;

        const frameHost = new FarcasterFrameHost(context, {
            frame: () => frame,
            ready: (options?: Partial<ReadyOptions>) => {
                logger.info('[frame client] ready', JSON.stringify(options));
                if (options) nativeBridgeProvider.request(SupportedMethod.SET_FRAME_READY_OPTIONS, options);
                setReady(true);
            },
            close: () => {
                logger.info('[frame client] close');
                nativeBridgeProvider.request(SupportedMethod.CLOSE, {});
            },
            signIn: async (options) => {
                logger.info('[frame client] signIn options', JSON.stringify(options));
                const signature = await RelayConfirmationPopoverRef.openAndWaitForClose({
                    fid: context.client.clientFid,
                    frame,
                    options,
                });
                logger.info('[frame client] signIn result', JSON.stringify(signature));

                return signature;
            },
            setPrimaryButton: (options) => {
                logger.info('[frame client] setPrimaryButton', JSON.stringify(options));
                nativeBridgeProvider.request(SupportedMethod.SET_PRIMARY_BUTTON, options);
            },
            eip6963RequestProvider: () => {
                endpointRef.current?.emit({
                    event: 'eip6963:announceProvider',
                    info: EIP6963_PROVIDER_DESCRIPTION,
                });
            },
            composeCast: (async (options) => {
                await nativeBridgeProvider.request(SupportedMethod.COMPOSE, {
                    text: options.text ?? '',
                    activity: '',
                    mentions: [],
                });
                return {
                    cast: null,
                };
            }) as MiniAppHost['composeCast'],
            swapToken: frameSwapToken,
        });

        return {
            frame,
            frameHost,
        };
    }, [supported]);

    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const { frame, frameHost } = value ?? {};

    const { data: author } = useFrameAuthor(frame);

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

        endpointRef.current = result.endpoint;

        return () => {
            result?.cleanup();
            endpointRef.current = null;
        };
    }, [supported, frame, frameHost]);

    const onSwitchWallet = async () => {
        try {
            await ethProvider.request({
                method: EthereumMethodType.FIREFLY_FRAME_SWITCH_WALLET,
                params: [],
            });
            bom.location?.reload();
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to switch wallet. Please try again</Trans>);
            throw error;
        }
    };

    const onReload = () => {
        bom.location?.reload();
    };

    const onClose = () => {
        if (supported) nativeBridgeProvider.request(SupportedMethod.CLOSE, {});
        else bom.window?.close();
    };

    if ((!loadingSupported && !supported) || error) {
        return (
            <FramePage>
                <FramePageTitle frame={frame} onClose={onClose} onReload={onReload} onSwitchWallet={onSwitchWallet}>
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
    const u = frame?.x_url ? parseUrl(frame.x_url) : null;

    return (
        <FramePage>
            <FramePageTitle frame={frame} onClose={onClose} onReload={onReload} onSwitchWallet={onSwitchWallet}>
                {frame ? (
                    <>
                        {frame.x_manifest?.frame.iconUrl ? (
                            <Image
                                src={frame.x_manifest?.frame.iconUrl}
                                alt={frame.button.title}
                                width={24}
                                height={24}
                                className="rounded-md"
                            />
                        ) : null}
                        <div className={frame.x_manifest?.frame.iconUrl ? 'text-left' : ''}>
                            <h2 className="font-bold">{frame.x_manifest?.frame.name || frame.button.action.name}</h2>
                            {author ? (
                                <div className="flex gap-1 text-xs text-secondary">
                                    <Trans>by {author.fullHandle || author.displayName}</Trans>
                                    <ProfileVerifyBadge
                                        className="flex shrink-0 items-center space-x-1"
                                        profile={author}
                                    />
                                </div>
                            ) : u ? (
                                <div className="text-sm text-secondary">{u.host}</div>
                            ) : null}
                        </div>
                    </>
                ) : (
                    <span className="text-xs text-second">
                        <Trans>Loading...</Trans>
                    </span>
                )}
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
                                fallback="avatar"
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
