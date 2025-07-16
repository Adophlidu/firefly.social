import {
    createOkxSwapWidget,
    type EthereumProvider,
    OkxEvents,
    type OkxSwapWidgetHandler,
    ProviderType,
    THEME,
    TradeType,
} from '@okxweb3/dex-widget';
import { CoreChainController } from '@reown/appkit';
import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { mainnet } from 'viem/chains';
import { getConnections } from 'wagmi/actions';

import { FireflyWalletChainSelectorWithOkxProviderType } from '@/components/FireflyWallet/FireflyWalletChainSelectorWithOkxProviderType.js';
import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { config } from '@/configs/wagmiClient.js';
import { SOLANA_CHAIN_ID_IN_FIREFLY, SOLANA_CHAIN_ID_IN_OKX } from '@/constants/chain.js';
import { Locale } from '@/constants/enum.js';
import { useLocale } from '@/helpers/getCookies.js';
import { getWagmiCurrentConnectionId } from '@/helpers/getWagmiCurrentConnectionId.js';
import { resolveWagmiChain } from '@/helpers/resolveWagmiChain.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { EthereumWalletProvider, SolanaWalletProvider } from '@/providers/okx/WalletProvider.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useThemeModeStore } from '@/store/useThemeModeStore.js';

const LangMap = {
    [Locale.en]: 'en_us',
    [Locale.zhHans]: 'zh_cn',
    [Locale.zhHant]: 'zh_tw',
};

export interface SwapModalOpenProps {
    chainId?: number;
    fromToken?: string;
    toToken?: string;
    providerType?: ProviderType;
    chainIds?: string[];
    providerSwitchable?: boolean;
}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<SwapModalOpenProps>>;
};

function getConnectWalletName(isEvm: boolean) {
    if (isEvm) {
        const connections = getConnections(config);
        const currentConnectionId = getWagmiCurrentConnectionId();
        return connections.find((x) => x.connector.id === currentConnectionId)?.connector.name;
    }
    const info = CoreChainController.state.chains.get('solana')?.accountState?.connectedWalletInfo;
    return info?.name;
}

export function SwapModal({ ref }: Props) {
    const [widgetRef, setWidgetRef] = useState<HTMLDivElement | null>(null);

    const locale = useLocale();
    const [props, setProps] = useState<SwapModalOpenProps>();
    const [networkType, setNetworkType] = useState<ProviderType>(ProviderType.EVM);
    const mode = useThemeModeStore.use.themeMode();
    const instanceRef = useRef<OkxSwapWidgetHandler | undefined>(undefined);

    const isDark = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = isDark || mode === 'dark' ? THEME.DARK : THEME.LIGHT;

    const isEvm = networkType === ProviderType.EVM;

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
            if (props.providerType) {
                setNetworkType(props.providerType);
            }
        },
        onClose: () => {
            instanceRef.current?.destroy();
            instanceRef.current = undefined;
        },
    });

    useEffect(() => {
        if (!instanceRef.current) return;

        instanceRef.current.updateParams({ theme });
    }, [theme]);

    useEffect(() => {
        if (!widgetRef || !open) return;
        const evmProvider = new EthereumWalletProvider();
        const solanaProvider = new SolanaWalletProvider();
        const provider = isEvm ? evmProvider : solanaProvider;

        const chainId =
            props?.chainId === SOLANA_CHAIN_ID_IN_FIREFLY ? SOLANA_CHAIN_ID_IN_OKX : (props?.chainId ?? mainnet.id);
        const tokenPair = {
            fromChain: chainId,
            toChain: chainId,
            fromToken: props?.fromToken,
            toToken: props?.toToken,
        };

        const params = {
            tradeType: TradeType.SWAP,
            lang: LangMap[locale] || 'en_us',
            theme,
            width: 400,
            providerType: networkType,
            chainIds: props?.chainIds,
            tokenPair,
        };

        const instance = createOkxSwapWidget(widgetRef, {
            params,
            provider: provider as EthereumProvider,
            listeners: [
                {
                    event: OkxEvents.ON_CONNECT_WALLET,
                    handler: () => {
                        if (isEvm) {
                            evmProvider.enable();
                        } else {
                            solanaProvider.connect();
                        }
                    },
                },
                {
                    event: OkxEvents.ON_FULFILLED_ORDER,
                    handler: async (params) => {
                        const { chainId, order } = params;
                        captureSwapEvent(EventId.EVENT_SWAP_SUCCESS, {
                            chain_id: params.chainId as number,
                            chain_name: resolveWagmiChain(chainId)?.name,
                            wallet_type: isEvm ? 'evm' : 'solana',
                            wallet_name: getConnectWalletName(isEvm) || 'Unknown',
                            wallet_address: isEvm ? evmProvider.selectedAddress : solanaProvider.publicKey?.toString(),
                            amount: order.buyAmount,
                            time: order.creationDate,
                        });
                    },
                },
            ],
        });
        instanceRef.current = instance;

        return () => {
            instanceRef.current?.destroy();
            instanceRef.current = undefined;
        };
    }, [props, locale, theme, open, widgetRef, networkType, isEvm]);

    return (
        <Modal onClose={() => dispatch?.close()} open={open}>
            <div className="relative z-10 w-[calc(100%-40px)] max-w-[400px] overflow-hidden rounded-2xl border-line bg-white pt-6 dark:bg-black">
                <div className="relative z-1 -mb-4 flex h-8 w-full items-center justify-between px-6">
                    <CloseButton
                        className="text-main"
                        onClick={() => {
                            dispatch?.close();
                        }}
                    />
                    {props?.providerSwitchable ? (
                        <FireflyWalletChainSelectorWithOkxProviderType
                            selectedChain={networkType}
                            onSelectChain={setNetworkType}
                        />
                    ) : null}
                </div>
                <div
                    className="min-h-[550px]"
                    ref={(ref) => {
                        setWidgetRef(ref);
                    }}
                />
            </div>
        </Modal>
    );
}
