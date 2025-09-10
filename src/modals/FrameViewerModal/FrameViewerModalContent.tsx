import { exposeToIframe } from '@farcaster/miniapp-host';
import { Trans } from '@lingui/react/macro';
import { type ReactNode,useEffect, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { Image } from '@/components/Image.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { EIP6963_PROVIDER_DESCRIPTION, IS_DEVELOPMENT } from '@/constants/index.js';
import { createEIP1193Provider } from '@/helpers/createEIP1193Provider.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { switchEthereumChain } from '@/helpers/switchEthereumChain.js';
import { Modals } from '@/modals/FrameViewerModal/modals.js';
import { FarcasterFrameHost } from '@/providers/frame/Host.js';
import { captureFrameActionEvent } from '@/providers/telemetry/captureFrameActionEvent.js';
import type { FrameV2 } from '@/types/frame.js';
import { EthereumMethodType } from '@/web3-shared/evm/types.js';

export type FrameViewerModalOpenProps = {
    ready: boolean;
    timeout: boolean;
    frame: FrameV2;
    frameHost: FarcasterFrameHost;
};
export type FrameViewerModalCloseProps = void;

type Props = {
    open: boolean;
    onClose?: () => void;
    props: FrameViewerModalOpenProps | null;
    setProps: React.Dispatch<React.SetStateAction<FrameViewerModalOpenProps | null>>;
};

export function FrameViewerModal({ open, onClose, props, setProps }: Props) {
    const frameRef = useRef<HTMLIFrameElement | null>(null);

    const account = useAccount();
    const chainId = useChainId();
    const [errorMessage, setErrorMessage] = useState<ReactNode | null>(null);

    const endpointRef = useRef<ReturnType<typeof exposeToIframe>['endpoint']>(null);

    useEffect(() => {
        if (!frameRef.current) return;

        // frame host is required
        if (!props?.frameHost) return;

        const result = exposeToIframe({
            debug: IS_DEVELOPMENT,
            iframe: frameRef.current,
            sdk: new FarcasterFrameHost(props.frameHost.context, {
                ...props.frameHost.options,
                eip6963RequestProvider: () => {
                    endpointRef?.current?.emit({
                        event: 'eip6963:announceProvider',
                        info: EIP6963_PROVIDER_DESCRIPTION,
                    });
                },
            }),
            ethProvider: createEIP1193Provider(async (parameters) => {
                const { method, params } = parameters;

                const client = await getWalletClientRequired(wagmiConfig);

                switch (method) {
                    case EthereumMethodType.ETH_REQUEST_ACCOUNTS:
                        return [client.account.address];
                    case EthereumMethodType.WALLET_SWITCH_ETHEREUM_CHAIN:
                        try {
                            const chain = params[0] as { chainId: string };
                            const chainId = Number.parseInt(chain.chainId, 16);
                            await switchEthereumChain(chainId);
                        } catch (error) {
                            enqueueMessageFromError(error, <Trans>Failed to switch chain</Trans>);
                            throw error;
                        }
                        return;
                    case EthereumMethodType.ETH_SEND_TRANSACTION: {
                        await captureFrameActionEvent('others', props.frame, client.account.address, true);
                        await client.request(parameters as Parameters<typeof client.request>[0]);
                        await captureFrameActionEvent('others', props.frame, client.account.address);
                        return;
                    }
                    default:
                        const result = await client.request(parameters as Parameters<typeof client.request>[0]);
                        return result;
                }
            }),
            miniAppOrigin: '*',
        });

        const timer = setTimeout(
            () => {
                setProps((prev) => {
                    if (!prev || prev.ready || prev.timeout) return prev;
                    return {
                        ...prev,
                        timeout: true,
                    };
                });
            },
            1000 * 60 * 3,
        ); // 3 minutes timeout

        endpointRef.current = result.endpoint;

        return () => {
            result?.cleanup();
            clearTimeout(timer);
            endpointRef.current = null;
        };
    }, [
        setProps,
        props?.frame,
        props?.frameHost,
        // refresh the provider after account changed
        account,
        // refresh the provider after chain id changed
        chainId,
    ]);

    if (!open || !props) return null;

    const { frame } = props;

    return (
        <>
            <Modals />
            <iframe
                className="scrollbar-hide h-full w-full opacity-100"
                ref={frameRef}
                src={frame.button.action.url}
                allow="clipboard-write 'src'"
                sandbox="allow-forms allow-scripts allow-popups allow-same-origin"
                style={{
                    backgroundColor: frame.button.action.splashBackgroundColor,
                }}
                onLoad={() => {
                    try {
                        if (frameRef.current?.contentDocument || frameRef.current?.contentWindow?.document) {
                            console.log(
                                `[FrameViewerModal] miniapp loaded and accessible, url=${frame.button.action.url}`,
                            );
                        }
                    } catch {
                        setErrorMessage(
                            <Trans>Miniapp loaded but not accessible (likely cross-origin or blocked)</Trans>,
                        );
                    }
                }}
                onError={() => {
                    setErrorMessage(<Trans>Failed to load miniapp. Please try again later.</Trans>);
                }}
            />
            {props.timeout ? (
                <div className="absolute inset-0 top-[60px] flex items-center justify-center bg-primaryBottom">
                    <p className="text-sm">
                        <Trans>The content is taking too long to load. Please try again later.</Trans>
                    </p>
                </div>
            ) : errorMessage ? (
                <div className="absolute inset-0 top-[60px] flex items-center justify-center bg-primaryBottom">
                    <p className="text-sm">{errorMessage}</p>
                </div>
            ) : !props.ready ? (
                <div
                    className="absolute inset-0 top-[60px] flex items-center justify-center"
                    style={{
                        backgroundColor: frame.button.action.splashBackgroundColor,
                    }}
                >
                    <Image alt={frame.button.title} width={80} height={80} src={frame.button.action.splashImageUrl} />
                </div>
            ) : null}
        </>
    );
}
