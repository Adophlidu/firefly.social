import {
    createOkxSwapWidget,
    OkxEvents,
    type OkxSwapWidgetHandler,
    ProviderType,
    THEME,
    TradeType,
} from '@okxweb3/dex-widget';
import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { mainnet } from 'viem/chains';

import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { SOLANA_CHAIN_ID_IN_FIREFLY, SOLANA_CHAIN_ID_IN_OKX } from '@/constants/chain.js';
import { Locale } from '@/constants/enum.js';
import { useLocale } from '@/helpers/getCookies.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
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
}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<SwapModalOpenProps>>;
};

export function SwapModal({ ref }: Props) {
    const [widgetRef, setWidgetRef] = useState<HTMLDivElement | null>(null);

    const locale = useLocale();
    const [props, setProps] = useState<SwapModalOpenProps>();
    const mode = useThemeModeStore.use.themeMode();
    const instanceRef = useRef<OkxSwapWidgetHandler | undefined>(undefined);

    const isDark = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = isDark || mode === 'dark' ? THEME.DARK : THEME.LIGHT;

    const networkType = props?.providerType ?? ProviderType.EVM;
    const provider = networkType === ProviderType.EVM ? window.ethereum : window.solana;

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
        onClose: () => {
            instanceRef.current?.destroy();
            instanceRef.current = undefined;
        },
    });

    useEffect(() => {
        if (!widgetRef || !open) return;
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

        const listeners = [
            {
                event: OkxEvents.ON_CONNECT_WALLET,
                handler: () => {
                    provider.enable();
                },
            },
        ];

        const instance = createOkxSwapWidget(widgetRef, {
            params,
            provider,
            listeners,
        });
        instanceRef.current = instance;

        return () => {
            instanceRef.current?.destroy();
            instanceRef.current = undefined;
        };
    }, [props, provider, locale, theme, open, widgetRef, networkType]);

    return (
        <Modal onClose={() => dispatch?.close()} open={open}>
            <div className="relative z-10 overflow-hidden rounded-2xl border-line bg-white pt-2 dark:bg-black">
                <CloseButton
                    className="absolute left-1 top-1 text-main"
                    onClick={() => {
                        dispatch?.close();
                    }}
                />
                <div
                    ref={(ref) => {
                        setWidgetRef(ref);
                    }}
                />
            </div>
        </Modal>
    );
}
