import { Trans } from '@lingui/react/macro';
import { useLocation } from '@tanstack/react-router';
import { compact, first, flatten, noop, uniqBy } from 'lodash-es';
import {
    createContext,
    type Dispatch,
    type PropsWithChildren,
    type ReactNode,
    type SetStateAction,
    useMemo,
    useState,
} from 'react';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useEnsName } from 'wagmi';

import WalletIcon from '@/assets/wallet2.svg';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { NetworkType } from '@/constants/enum.js';
import { EMPTY_LIST, SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { RED_PACKET_DEFAULT_SHARES } from '@/constants/rp.js';
import { getNativeToken } from '@/helpers/getNativeToken.js';
import { multipliedBy } from '@/helpers/number.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { useRedPacketThemes } from '@/hooks/useRedPacketThemes.js';
import type { Collection } from '@/modals/NonFungibleCollectionSelectModal/CollectionItem.js';
import { FireflyRedPacketAPI, RequirementType } from '@/providers/types/FireflyRedPacket.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import type { FungibleToken } from '@/web3-shared/base/specs.js';
import type { EthereumChainId, EthereumSchemaType } from '@/web3-shared/evm/types.js';

export const redPacketRandomTabs = [
    {
        label: <Trans>Random Split</Trans>,
        value: 'random',
    },
    {
        label: <Trans>Equal Split</Trans>,
        value: 'equal',
    },
] as const;

export const redPacketCoverTabs = [
    {
        label: <Trans>Template</Trans>,
        value: 'default',
    },
    {
        label: <Trans>Custom</Trans>,
        value: 'custom',
    },
] as const;

export const redPacketFontColorTabs = [
    {
        label: <Trans>Golden</Trans>,
        value: 'golden',
    },
    {
        label: <Trans>Neutral</Trans>,
        value: 'neutral',
    },
] as const;

export const redPacketTypeTabs = [
    {
        label: <Trans>EVM</Trans>,
        value: NetworkType.Ethereum,
    },
    {
        label: <Trans>Solana</Trans>,
        value: NetworkType.Solana,
    },
];

type RandomType = (typeof redPacketRandomTabs)[number]['value'];
type CoverTabType = (typeof redPacketCoverTabs)[number]['value'];
type FontColorTabType = (typeof redPacketFontColorTabs)[number]['value'];

interface RedPacketContextValue {
    message: string;
    token: FungibleToken<number, number>;
    randomType: RandomType;
    shares: number;
    coverType: CoverTabType;
    fontColor: FontColorTabType;
    accounts: Array<{ icon: ReactNode; name: string }>;
    shareFrom: string;
    rawAmount: string;
    setRawAmount: Dispatch<SetStateAction<string>>;
    totalAmount: string;
    rules: RequirementType[];
    requireCollections: Collection[];
    setRequireCollections: Dispatch<SetStateAction<Collection[]>>;
    requireTokens: Array<{ token: FungibleToken<EthereumChainId, EthereumSchemaType>; quantity: string }>;
    setRequireTokens: Dispatch<
        SetStateAction<Array<{ token: FungibleToken<EthereumChainId, EthereumSchemaType>; quantity: string }>>
    >;
    requireChannel: Channel | undefined;
    setRequireChannel: Dispatch<SetStateAction<Channel | undefined>>;
    requireClub: Channel | undefined;
    setRequireClub: Dispatch<SetStateAction<Channel | undefined>>;
    setRules: Dispatch<SetStateAction<RequirementType[]>>;
    setToken: Dispatch<SetStateAction<FungibleToken<number, number> | undefined>>;
    setRandomType: Dispatch<SetStateAction<RandomType>>;
    setMessage: Dispatch<SetStateAction<string>>;
    setShares: Dispatch<SetStateAction<number>>;
    setCoverType: Dispatch<SetStateAction<CoverTabType>>;
    setFontColor: Dispatch<SetStateAction<FontColorTabType>>;
    setShareFrom: Dispatch<SetStateAction<string>>;
    customThemes: FireflyRedPacketAPI.ThemeGroupSettings[];
    setCustomThemes: Dispatch<SetStateAction<FireflyRedPacketAPI.ThemeGroupSettings[]>>;
    themes: FireflyRedPacketAPI.ThemeGroupSettings[];
    theme: FireflyRedPacketAPI.ThemeGroupSettings;
    setTheme: Dispatch<SetStateAction<FireflyRedPacketAPI.ThemeGroupSettings | undefined>>;
    networkType: NetworkType;
    setNetworkType: Dispatch<SetStateAction<NetworkType>>;
}

const initialRedPacketContextValue: RedPacketContextValue = {
    networkType: NetworkType.Ethereum,
    message: '',
    shares: RED_PACKET_DEFAULT_SHARES,
    randomType: redPacketRandomTabs[0].value,
    coverType: redPacketCoverTabs[0].value,
    fontColor: redPacketFontColorTabs[0].value,
    accounts: EMPTY_LIST,
    shareFrom: '',
    token: null!,
    totalAmount: '',
    requireCollections: EMPTY_LIST,
    setRequireCollections: noop,
    requireTokens: EMPTY_LIST,
    setRequireTokens: noop,
    requireChannel: undefined,
    setRequireChannel: noop,
    requireClub: undefined,
    setRequireClub: noop,
    rules: EMPTY_LIST,
    setRules: noop,
    setShareFrom: noop,
    setRandomType: noop,
    setShares: noop,
    setMessage: noop,
    setToken: noop,
    setCoverType: noop,
    setFontColor: noop,
    rawAmount: '',
    setRawAmount: noop,
    customThemes: EMPTY_LIST,
    setCustomThemes: noop,
    themes: EMPTY_LIST,
    theme: null!,
    setTheme: noop,
    setNetworkType: noop,
};

export const RedPacketContext = createContext<RedPacketContextValue>(initialRedPacketContextValue);

export function RedPacketProvider({ children }: PropsWithChildren) {
    const { ethereum, solana } = useWalletAccountAll();

    const { data: ensName } = useEnsName({ address: ethereum.address as Address, chainId: mainnet.id });
    const allProfile = useProfileStoreAll();
    const [message, setMessage] = useState('');
    const [shares, setShares] = useState<number>(RED_PACKET_DEFAULT_SHARES);
    const [randomType, setRandomType] = useState<RandomType>('random');
    const [customThemes, setCustomThemes] = useState<FireflyRedPacketAPI.ThemeGroupSettings[]>([]);
    const { data: themes = EMPTY_LIST } = useRedPacketThemes();
    const [theme = themes[0], setTheme] = useState<FireflyRedPacketAPI.ThemeGroupSettings>();

    const paramNetworkType: NetworkType = useLocation().search?.networkType;
    const [networkType, setNetworkType] = useState<NetworkType>(() => {
        if (paramNetworkType) return paramNetworkType;

        return ethereum.address ? NetworkType.Ethereum : solana.address ? NetworkType.Solana : NetworkType.Ethereum;
    });
    const { chainId, account } = useChainContext({ networkType });

    const nativeToken = getNativeToken(networkType, chainId);
    const [token = nativeToken, setToken] = useState<FungibleToken<number, number>>();
    const [coverType, setCoverType] = useState<CoverTabType>('default');
    const [fontColor, setFontColor] = useState<FontColorTabType>('golden');
    const [shareFrom, setShareFrom] = useState<string>('');
    const [rules, setRules] = useState<RequirementType[]>([]);
    const [requireCollections, setRequireCollections] =
        useState<RedPacketContextValue['requireCollections']>(EMPTY_LIST);
    const [requireTokens, setRequireTokens] = useState<RedPacketContextValue['requireTokens']>(EMPTY_LIST);
    const [requireChannel, setRequireChannel] = useState<RedPacketContextValue['requireChannel']>();
    const [requireClub, setRequireClub] = useState<RedPacketContextValue['requireClub']>();

    const [rawAmount, setRawAmount] = useState('');
    const isRandom = randomType === 'random';
    const totalAmount = useMemo(
        () => (isRandom || !rawAmount ? rawAmount : multipliedBy(rawAmount, shares).toFixed()),
        [rawAmount, isRandom, shares],
    );

    const isEVM = networkType === NetworkType.Ethereum;
    const accounts = useMemo(() => {
        return uniqBy(
            compact(
                flatten([
                    ...SORTED_SOCIAL_SOURCES.map((source) => {
                        const profile = allProfile[source]?.currentProfile;
                        if (!profile) return EMPTY_LIST;

                        return [
                            { icon: <SocialSourceIcon source={source} size={24} />, name: profile.handle },
                            profile.ownedBy && isEVM
                                ? {
                                      icon: <WalletIcon width={24} height={24} />,
                                      name: profile.ownedBy.address,
                                  }
                                : undefined,
                        ];
                    }),
                    account
                        ? {
                              icon: <WalletIcon width={24} height={24} />,
                              name: isEVM ? ensName || account : account,
                          }
                        : undefined,
                ]),
            ),
            (x) => x.name.toLowerCase(),
        );
    }, [allProfile, ensName, account, isEVM]);

    const ctxValue = useMemo(
        () => ({
            message,
            setMessage,
            shares,
            setShares,
            randomType,
            setRandomType,
            token,
            setToken,
            coverType,
            setCoverType,
            fontColor,
            setFontColor,
            accounts,
            shareFrom: shareFrom || first(accounts)?.name || '',
            setShareFrom,
            totalAmount,
            rules,
            setRules,
            requireCollections,
            setRequireCollections,
            requireTokens,
            setRequireTokens,
            requireChannel,
            setRequireChannel,
            requireClub,
            setRequireClub,
            rawAmount,
            setRawAmount,
            customThemes,
            setCustomThemes,
            themes,
            theme,
            setTheme,
            networkType,
            setNetworkType,
        }),
        [
            message,
            shares,
            randomType,
            token,
            coverType,
            fontColor,
            accounts,
            shareFrom,
            totalAmount,
            rules,
            requireCollections,
            requireTokens,
            requireChannel,
            requireClub,
            rawAmount,
            customThemes,
            themes,
            theme,
            networkType,
        ],
    );

    return <RedPacketContext.Provider value={ctxValue}>{children}</RedPacketContext.Provider>;
}
