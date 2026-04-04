import { EMPTY_LIST, IS_DEVELOPMENT } from '@dimensiondev/constants';
import { classNames, delay } from '@dimensiondev/utils';
import { exposeToIframe } from '@farcaster/miniapp-host';
import { Trans } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { useAsync } from 'react-use';
import { type Address, type Hex } from 'viem';
import { useChainId, useConnection } from 'wagmi';

import { frameSwapToken } from '@/components/Frame/V2/frameSwapToken.js';
import { Image } from '@/components/Image.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { EIP6963_PROVIDER_DESCRIPTION } from '@/constants/static.js';
import { createEIP1193Provider } from '@/helpers/createEIP1193Provider.js';
import { eip5792Polyfill } from '@/helpers/eip5792Polyfill.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { switchEthereumChain } from '@/helpers/switchEthereumChain.js';
import { useStateMachine } from '@/hooks/useStateMachine.js';
import {
    RelayConfirmationPopover,
    RelayConfirmationPopoverRef,
} from '@/modals/FrameViewerModal/RelayConfirmationPopover.js';
import { checkMiniAppBlocking } from '@/providers/firefly/worker/checkMiniAppBlocking.js';
import { FarcasterFrameHost } from '@/providers/frame/Host.js';
import { captureFrameActionEvent } from '@/providers/telemetry/captureFrameActionEvent.js';
import { type Frame, type FrameV2 } from '@/types/frame.js';
import { EthereumMethodType } from '@/web3-shared/evm/types.js';

function createEthProvider(frame: Frame) {
    return createEIP1193Provider(
        eip5792Polyfill(async (parameters) => {
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
                    await captureFrameActionEvent('others', frame, client.account.address, true);
                    const txParams = parameters.params[0] as { to: Address; data?: Hex; value?: string };
                    const hash = await client.sendTransaction({
                        to: txParams.to,
                        data: txParams.data,
                        value: txParams.value ? BigInt(txParams.value) : undefined,
                    });
                    await captureFrameActionEvent('others', frame, client.account.address);
                    return hash;
                }
                default:
                    const result = await client.request(parameters as Parameters<typeof client.request>[0]);
                    return result;
            }
        }),
    );
}

export interface FrameViewerModalOpenProps {
    ready: boolean;
    frame: FrameV2;
    frameHost: FarcasterFrameHost;
}

export type FrameViewerModalCloseProps = void;

interface Props {
    open: boolean;
    onClose?: () => void;
    props: FrameViewerModalOpenProps | null;
    setProps: React.Dispatch<React.SetStateAction<FrameViewerModalOpenProps | null>>;
}

export default function FrameViewerModalContent({ open, props, setProps }: Props) {
    const frameRef = useRef<HTMLIFrameElement | null>(null);

    const account = useConnection();
    const chainId = useChainId();

    const endpointRef = useRef<ReturnType<typeof exposeToIframe>['endpoint']>(null);
    const iframeUrl = props?.frame?.button.action.url;

    const machine = useStateMachine<'idle' | 'ready' | 'timeout' | 'blocking'>({
        initialState: 'idle',
        transitions: {
            idle: ['ready', 'blocking', 'timeout'],
            ready: EMPTY_LIST,
            timeout: EMPTY_LIST,
            blocking: EMPTY_LIST,
        },
    });

    useEffect(() => {
        if (open) return;
        machine.transition('idle');
    }, [open]);

    useEffect(() => {
        if (!props?.ready) return;
        machine.transition('ready');
    }, [props?.ready]);

    useAsync(async () => {
        // after 5 seconds, check if the mini app is blocked
        await delay(5000);

        const response = iframeUrl ? await checkMiniAppBlocking(iframeUrl) : null;
        if (response?.isBlocked) machine.transition('blocking');
        else machine.transition('ready');
    }, [iframeUrl]);

    useEffect(() => {
        if (!frameRef.current) return;

        // frame host is required
        if (!props?.frameHost) return;

        const result = exposeToIframe({
            debug: IS_DEVELOPMENT,
            iframe: frameRef.current,
            ethProvider: createEthProvider(props.frame),
            sdk: new FarcasterFrameHost(props.frameHost.context, {
                ...props.frameHost.options,
                eip6963RequestProvider: () => {
                    endpointRef?.current?.emit({
                        event: 'eip6963:announceProvider',
                        info: EIP6963_PROVIDER_DESCRIPTION,
                    });
                },
                swapToken: frameSwapToken,
            }),
            miniAppOrigin: '*',
        });

        const timer = setTimeout(() => machine.transition('timeout'), 1000 * 60 * 3); // 3 minutes timeout

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
            <RelayConfirmationPopover ref={RelayConfirmationPopoverRef.register} />
            <iframe
                className={classNames('no-scrollbar size-full opacity-100', machine.is('blocking') ? 'hidden' : '')}
                ref={frameRef}
                src={frame.button.action.url}
                allow="clipboard-write 'src'"
                sandbox="allow-forms allow-scripts allow-popups allow-same-origin"
                style={{
                    backgroundColor: frame.button.action.splashBackgroundColor,
                }}
            />
            {machine.is('blocking') ? (
                <div className="bg-bg dark:bg-darkBottom absolute inset-0 top-[60px] flex min-h-0 grow flex-col items-center justify-center">
                    <p className="p-2 text-sm font-bold">
                        <Trans>This mini app works only inside Farcaster. Open it there to check it out.</Trans>
                    </p>
                    <a
                        href={`https://farcaster.xyz/?launchFrameUrl=${frame.button.action.url}`}
                        className="bg-lightBg text-lightHighlight dark:bg-fireflyBrand rounded-lg px-3 py-2 font-bold dark:text-white"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Trans>Go to Farcaster</Trans>
                    </a>
                </div>
            ) : machine.is('timeout') ? (
                <div className="bg-primaryBottom absolute inset-0 top-[60px] flex items-center justify-center">
                    <p className="text-sm">
                        <Trans>Something went wrong. Please try again later.</Trans>
                    </p>
                </div>
            ) : machine.is('idle') ? (
                <div
                    className="absolute inset-0 top-[60px] flex items-center justify-center"
                    style={{
                        backgroundColor: frame.button.action.splashBackgroundColor,
                    }}
                >
                    <Image
                        alt={frame.button.title}
                        width={80}
                        height={80}
                        src={frame.button.action.splashImageUrl}
                        fallback="avatar"
                    />
                </div>
            ) : null}
        </>
    );
}
