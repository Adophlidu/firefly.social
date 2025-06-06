import { exposeToIframe } from '@farcaster/frame-host';
import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { useAccount } from 'wagmi';

import { CloseButton } from '@/components/IconButton.js';
import { Image } from '@/components/Image.js';
import { Modal } from '@/components/Modal.js';
import { config } from '@/configs/wagmiClient.js';
import { NetworkType } from '@/constants/enum.js';
import { IS_DEVELOPMENT } from '@/constants/index.js';
import { createEIP1193Provider } from '@/helpers/createEIP1193Provider.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { switchEthereumChain } from '@/helpers/switchEthereumChain.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { WalletConnectModalRef } from '@/modals/controls.js';
import { Modals } from '@/modals/FrameViewerModal/modals.js';
import { MoreAction } from '@/modals/FrameViewerModal/MoreActionMenu.js';
import { captureFrameActionEvent } from '@/providers/telemetry/captureFrameActionEvent.js';
import { type FrameV2, type FrameV2Host } from '@/types/frame.js';
import { EthereumMethodType } from '#masknet/web3-shared-evm';

export type FrameViewerModalOpenProps = {
    ready: boolean;
    timeout: boolean;
    frame: FrameV2;
    frameHost: FrameV2Host;
};
export type FrameViewerModalCloseProps = void;

type Props = {
    ref: React.Ref<SingletonModalRefCreator<FrameViewerModalOpenProps>>;
};

export function FrameViewerModal({ ref }: Props) {
    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const [props, setProps] = useState<FrameViewerModalOpenProps | null>(null);

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(p) {
            setProps(p);
        },
        onClose() {
            setProps(null);
        },
    });

    const account = useAccount();
    const { data: client } = useQuery({
        enabled: open,
        queryKey: ['wallet-client', account.address],
        queryFn: async () => getWalletClientRequired(config),
    });

    useEffect(() => {
        if (!frameRef.current) return;

        // frame host is required
        if (!props?.frameHost) return;
        if (!client) return;

        const result = exposeToIframe({
            debug: IS_DEVELOPMENT,
            iframe: frameRef.current,
            sdk: props.frameHost,
            ethProvider: createEIP1193Provider(async (parameters) => {
                const { method, params } = parameters;

                switch (method) {
                    case EthereumMethodType.ETH_REQUEST_ACCOUNTS:
                        return [account.address];
                    case EthereumMethodType.WALLET_SWITCH_ETHEREUM_CHAIN:
                        const chain = params[0] as { chainId: string };
                        const chainId = Number.parseInt(chain.chainId, 16);
                        await switchEthereumChain(chainId);
                        return;
                    case EthereumMethodType.ETH_SEND_TRANSACTION: {
                        await captureFrameActionEvent('others', props.frame, account.address);
                        return client.request(parameters as Parameters<typeof client.request>[0]);
                    }
                    default:
                        const result = await client.request(parameters as Parameters<typeof client.request>[0]);
                        return result;
                }
            }),
            frameOrigin: '*',
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

        return () => {
            result?.cleanup();
            clearTimeout(timer);
        };
    }, [props, client, account.address]);

    const [{ loading: reloading }, onReload] = useAsyncFn(async () => {
        if (!props) return;

        setProps(null);
        await delay(1000);
        setProps({
            ...props,
            ready: false,
        });
    }, [props]);

    const onSwitchWallet = useCallback(() => {
        WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
    }, []);

    if (!open || !props) return null;

    const { frame } = props;
    const u = parseUrl(frame.button.action.url);

    return (
        <Modal disableDialogClose open={open} onClose={() => dispatch?.close()}>
            <div className="relative flex h-[755px] w-[424px] flex-col overflow-hidden rounded-xl">
                <div className="flex h-[60px] flex-1 items-center justify-between bg-lightBg px-4 py-3 text-black dark:bg-fireflyBrand dark:text-white">
                    <div className="cursor-pointer">
                        <CloseButton onClick={() => dispatch?.close()} />
                    </div>
                    <div className="mx-4 flex max-w-[280px] flex-1 items-center justify-center gap-2">
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
                            <h1 className="font-bold">{frame.x_manifest?.frame.name || frame.button.action.name}</h1>
                            {u ? <div className="text-xs text-secondary">{u.host}</div> : null}
                        </div>
                    </div>
                    <div>
                        <MoreAction
                            frame={frame}
                            disabled={reloading}
                            onReload={onReload}
                            onSwitchWallet={onSwitchWallet}
                        />
                    </div>
                </div>
                <iframe
                    className="scrollbar-hide h-full w-full opacity-100"
                    ref={frameRef}
                    src={frame.button.action.url}
                    allow="clipboard-write 'src'"
                    sandbox="allow-forms allow-scripts allow-popups allow-same-origin"
                    style={{
                        backgroundColor: frame.button.action.splashBackgroundColor,
                    }}
                />
                {props.timeout ? (
                    <div className="absolute inset-0 top-[60px] flex items-center justify-center bg-primaryBottom">
                        <p className="text-sm">
                            <Trans>Something went wrong. Please try again later.</Trans>
                        </p>
                    </div>
                ) : !props.ready ? (
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
                        />
                    </div>
                ) : null}

                <Modals />
            </div>
        </Modal>
    );
}
