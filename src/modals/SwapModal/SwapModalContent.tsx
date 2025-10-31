'use client';

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
import { produce } from 'immer';
import { uniq } from 'lodash-es';
import { type HTMLProps, memo, useEffect, useMemo, useRef, useState } from 'react';
import { mainnet } from 'viem/chains';
import { getConnections } from 'wagmi/actions';

import { FireflyWalletChainSelectorWithOkxProviderType } from '@/components/FireflyWallet/FireflyWalletChainSelectorWithOkxProviderType.js';
import { CloseButton } from '@/components/IconButton.js';
import { Loading } from '@/components/Loading.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { Locale, OkxProviderType } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { NATIVE_SOLANA_TOKEN_ADDRESS, NATIVE_TOKEN_ADDRESS, SOLANA_CHAIN_ID_IN_OKX } from '@/constants/okx.js';
import { classNames } from '@/helpers/classNames.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { delay } from '@/helpers/delay.js';
import { useLocale } from '@/helpers/getCookies.js';
import { getWagmiCurrentConnectionId } from '@/helpers/getWagmiCurrentConnectionId.js';
import { resolveWagmiChain } from '@/helpers/resolveWagmiChain.js';
import { useSolanaAccount } from '@/hooks/useAccountByNetwork.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { EthereumWalletProvider, SolanaWalletProvider } from '@/providers/okx/WalletProvider.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { SolanaNetworkType } from '@/store/useSolanaActiveNetworkStore.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

const LangMap = {
    [Locale.en]: 'en_us',
    [Locale.zhHans]: 'zh_cn',
    [Locale.zhHant]: 'zh_tw',
};

export interface SwapModalOpenProps {
    chainId?: number;
    fromToken?: string;
    toToken?: string;
    providerType?: OkxProviderType;
    chainIds?: string[];
    providerSwitchable?: boolean;
    toChainId?: number;
}

function getConnectWalletName(isEvm: boolean) {
    if (isEvm) {
        const connections = getConnections(wagmiConfig);
        const id = getWagmiCurrentConnectionId();
        return connections.find((x) => x.connector.id === id || x.connector.uid === id)?.connector.name;
    }
    const info = CoreChainController.state.chains.get('solana')?.accountState?.connectedWalletInfo;
    return info?.name;
}

const resolveProviderType = createLookupTableResolver<OkxProviderType, ProviderType>(
    {
        [OkxProviderType.EVM]: ProviderType.EVM,
        [OkxProviderType.SOLANA]: ProviderType.SOLANA,
        [OkxProviderType.WALLET_CONNECT]: ProviderType.WALLET_CONNECT,
    },
    (providerType) => {
        throw new UnreachableError('providerType', providerType);
    },
);

interface SwapModalContentProps extends HTMLProps<HTMLDivElement> {
    open: boolean;
    onClose?: () => void;
    embed?: boolean;
    props?: SwapModalOpenProps;
}

export const SwapModalContent = memo(function SwapModalContent({
    open,
    embed = false,
    onClose,
    props,
    className,
    ...rest
}: SwapModalContentProps) {
    const isPrivyReady = usePrivyWalletStore((x) => x.ready);
    const solana = useSolanaAccount();
    const isReady = solana.type === SolanaNetworkType.Privy ? isPrivyReady : true;
    const isSolanaChainId = props?.chainId === SolanaChainId.Mainnet || props?.chainId === SOLANA_CHAIN_ID_IN_OKX;
    const [_providerType, setProviderType] = useState<OkxProviderType>(
        isSolanaChainId ? OkxProviderType.SOLANA : OkxProviderType.EVM,
    );
    const providerType = isSolanaChainId ? OkxProviderType.SOLANA : _providerType;
    const [isLoading, setIsLoading] = useState(false);
    return (
        <div
            className={classNames(
                'relative z-10 w-full overflow-hidden bg-white dark:bg-black',
                !embed ? 'rounded-2xl' : 'flex flex-col',
                className,
            )}
            {...rest}
        >
            <div className="relative z-10 -mb-4 flex h-14 w-full items-center justify-between bg-white px-6 pt-6 empty:hidden dark:bg-black">
                {!embed ? <CloseButton className="text-main" onClick={onClose} /> : null}
                {props?.providerSwitchable ? (
                    <FireflyWalletChainSelectorWithOkxProviderType
                        selectedChain={providerType ?? OkxProviderType.EVM}
                        onSelectChain={async (x) => {
                            setIsLoading(true);
                            setProviderType(x);
                            await delay(1000);
                            setIsLoading(false);
                        }}
                    />
                ) : null}
            </div>
            <div className="public-content relative z-1 max-h-[90svh] min-h-[550px]">
                <div className="absolute left-0 top-0 z-0 size-full">
                    <Loading className="h-full" />
                </div>
                {!isLoading && isReady ? (
                    <SwapModalContentWidget
                        {...produce(props, (x) => {
                            if (!x) return;
                            if (x.chainId === SolanaChainId.Mainnet) {
                                x.chainId = SOLANA_CHAIN_ID_IN_OKX;
                            }
                            if (x.toChainId === SolanaChainId.Mainnet) {
                                x.toChainId = SOLANA_CHAIN_ID_IN_OKX;
                            }
                            if (x.chainIds?.includes(SolanaChainId.Mainnet.toString())) {
                                x.chainIds.push(SOLANA_CHAIN_ID_IN_OKX.toString());
                            }
                        })}
                        providerType={providerType}
                        key={providerType}
                    />
                ) : null}
            </div>
        </div>
    );
});

interface WidgetProps extends SwapModalOpenProps {
    providerType: OkxProviderType;
    embed?: boolean;
}

function SwapModalContentWidget({ providerType, embed, ...props }: WidgetProps) {
    const [widgetRef, setWidgetRef] = useState<HTMLDivElement | null>(null);
    const locale = useLocale();
    const isDarkMode = useIsDarkMode();
    const instanceRef = useRef<OkxSwapWidgetHandler | null>(null);
    const isEvm = providerType === OkxProviderType.EVM;

    const theme = isDarkMode ? THEME.DARK : THEME.LIGHT;

    useEffect(() => {
        if (!instanceRef.current) return;
        instanceRef.current.updateParams({ theme });
    }, [theme]);

    const evmProvider = useMemo(() => new EthereumWalletProvider(), []);
    const solanaProvider = useMemo(() => new SolanaWalletProvider(), []);

    useEffect(() => {
        if (!widgetRef) return;
        const provider = isEvm ? evmProvider : solanaProvider;
        const chainId = isEvm ? (props.chainId ?? mainnet.id) : SOLANA_CHAIN_ID_IN_OKX;
        const toChainId = props.toChainId ?? chainId;
        const isSwap = chainId === toChainId;
        const tokenPair = {
            fromChain: chainId,
            toChain: chainId,
            fromToken: props.fromToken ?? (isEvm ? NATIVE_TOKEN_ADDRESS : NATIVE_SOLANA_TOKEN_ADDRESS),
            toToken: props.toToken,
        };

        const bridgeTokenPair = !isSwap
            ? {
                  fromChain: chainId,
                  toChain: toChainId,
                  fromToken: props.fromToken ?? (isEvm ? NATIVE_TOKEN_ADDRESS : NATIVE_SOLANA_TOKEN_ADDRESS),
                  toToken: props.toToken,
              }
            : undefined;

        const params = {
            tradeType: isSwap ? TradeType.AUTO : TradeType.BRIDGE,
            lang: LangMap[locale] || 'en_us',
            theme,
            width: window.innerWidth < 440 ? window.innerWidth - 40 : 400,
            providerType: resolveProviderType(providerType),

            chainIds: props.chainIds ? uniq([...props.chainIds, chainId.toString()]) : [],
            tokenPair: isSwap ? tokenPair : undefined,
            bridgeTokenPair,
        };

        const connectWallet = () => {
            if (isEvm) {
                evmProvider.enable(!embed);
            } else {
                solanaProvider.connect(!embed);
            }
        };
        const instance = createOkxSwapWidget(widgetRef, {
            params,
            provider: provider as EthereumProvider,
            listeners: [
                {
                    event: OkxEvents.ON_CONNECT_WALLET,
                    handler: connectWallet,
                },
                {
                    event: OkxEvents.ON_SUBMIT_TX,
                    handler: (params) => {
                        const { chainId, txType, txHash } = params.data;
                        if (txType === 'SWAP') {
                            captureSwapEvent(EventId.EVENT_SWAP_SUBMIT, {
                                chain_id: chainId as number,
                                chain_name: resolveWagmiChain(chainId)?.name,
                                wallet_type: isEvm ? 'evm' : 'solana',
                                wallet_name: getConnectWalletName(isEvm) || 'Unknown',
                                wallet_address: isEvm
                                    ? evmProvider.selectedAddress
                                    : solanaProvider.publicKey?.toString(),
                                time: new Date().toISOString(),
                                tx_hash: txHash,
                            });
                        }
                    },
                },
                {
                    event: OkxEvents.ON_FULFILLED_ORDER,
                    handler: (params) => {
                        console.log('ON_FULFILLED_ORDER', params);
                    },
                },
            ],
        });
        instanceRef.current = instance;

        return () => {
            instanceRef.current?.destroy();
            instanceRef.current = null;
        };
    }, [
        locale,
        theme,
        widgetRef,
        providerType,
        isEvm,
        evmProvider,
        solanaProvider,
        props.fromToken,
        props.toToken,
        props.chainIds,
        props.toChainId,
        props.chainId,
        embed,
    ]);

    return (
        <div
            className="okx-widget-container no-scrollbar absolute left-0 top-0 size-full overflow-auto"
            ref={(ref) => {
                setWidgetRef(ref);
            }}
        />
    );
}
