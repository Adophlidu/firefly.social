import type { Context, ReadyOptions } from '@farcaster/miniapp-host';
import type { Address, Hex } from 'viem';

// Local copy to avoid depending on app-level utility types
type PartialWith<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export enum Theme {
    Auto = 'auto',
    Light = 'light',
    Dark = 'dark',
}

export enum Network {
    All = 'all',
    EVM = 'evm',
    Solana = 'solana',
}

export enum SupportedMethod {
    GET_SUPPORTED_METHODS = 'getSupportMethod',
    GET_AUTHORIZATION = 'getAuthorization',
    GET_THEME = 'getTheme',
    GET_LANGUAGE = 'getLanguage',
    GET_WALLET_ADDRESS = 'getWalletAddress',
    CONNECT_WALLET = 'connectWallet',
    BIND_WALLET = 'bindWallet',
    IS_TWITTER_USER_FOLLOWING = 'isTwitterUserFollowing',
    FOLLOW_TWITTER_USER = 'followTwitterUser',
    FOLLOW_LENS_USER = 'followLensUser',
    FOLLOW_FARCASTER_USER = 'followFarcasterUser',
    UPDATE_NAVIGATOR_BAR = 'updateNavigatorBar',
    OPEN_URL = 'openUrl',
    ADD_CALENDAR = 'addCalendar',
    LOGIN = 'login',
    SHARE = 'share',
    COMPOSE = 'compose',
    BACK = 'back',
    CLOSE = 'close',
    SET_PRIMARY_BUTTON = 'setPrimaryButton',
    GET_FRAME_CONTEXT = 'getFrameContext',
    SET_FRAME_READY_OPTIONS = 'setFrameReadyOptions',
    GET_CHAIN_ID = 'getChainId',
    SIGN_TRANSACTION = 'signTransaction',
    SEND_TRANSACTION = 'sendTransaction',
    SIGN_MESSAGE = 'signMessage',
    SIGN_TYPED_DATA = 'signTypedData',
    ADD_ETHEREUM_CHAIN = 'addEthereumChain',
    SWITCH_ETHEREUM_CHAIN = 'switchEthereumChain',
    SEND_EVM_TRANSACTION = 'sendEvmTransaction',
    SEND_SOLANA_TRANSACTION = 'sendSolanaTransaction',
    LOGIN_OR_BIND_EMAIL = 'loginOrBindEmail',
    FUND_PRIVY_ACCOUNT = 'fund_privy_account',
}

export enum SupportedEvent {
    CHANGE_ACCOUNT = 'changeAccount',
    CHANGE_CHAIN_ID = 'changeChainId',
    WEBVIEW_DID_FINISH_LOAD = 'webviewDidFinishLoad',
}

export interface Transaction {
    type: '0x1' | '0x2';
    nonce: string;
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit: string;
    maxPriorityFeePerGas: string;
    maxFeePerGas: string;
    chainId: string;
}

export interface Chain {
    chainId: string;
    blockExplorerUrls: string[];
    chainName: string;
    iconUrls: string[];
    nativeCurrency: {
        decimals: number;
        name: string;
        symbol: string;
    };
    rpcUrls: string[];
}

export interface MentionProfile {
    platform_id: string;
    platform: string; // FireflyPlatform (app-level) replaced with string to avoid coupling
    handle: string;
    name: string;
    namespace: string;
    hit: boolean;
    score: number;
}

export interface Mention {
    content: string;
    profiles: MentionProfile[];
}

export interface AddCalendarEventParams {
    title: string;
    startDate: number;
    endDate: number;
    location?: string;
    notes?: string;
}

export interface RequestArguments {
    [SupportedMethod.GET_SUPPORTED_METHODS]: {};
    [SupportedMethod.GET_AUTHORIZATION]: {};
    [SupportedMethod.GET_THEME]: {};
    [SupportedMethod.GET_LANGUAGE]: {};
    [SupportedMethod.GET_CHAIN_ID]: {
        type: Network;
    };
    [SupportedMethod.GET_WALLET_ADDRESS]: {
        type: Network;
    };
    [SupportedMethod.CONNECT_WALLET]: {
        type: Network;
    };
    [SupportedMethod.BIND_WALLET]: {
        type: Network;
    };
    [SupportedMethod.IS_TWITTER_USER_FOLLOWING]: {
        id: string;
    };
    [SupportedMethod.FOLLOW_TWITTER_USER]: {
        id: string;
    };
    [SupportedMethod.FOLLOW_LENS_USER]: {
        id: string;
    };
    [SupportedMethod.FOLLOW_FARCASTER_USER]: {
        id: string;
    };
    [SupportedMethod.UPDATE_NAVIGATOR_BAR]: {
        show: boolean;
        title: string;
    };
    [SupportedMethod.OPEN_URL]: {
        url: string;
    };
    [SupportedMethod.ADD_CALENDAR]: AddCalendarEventParams;
    [SupportedMethod.LOGIN]: {
        platform: string; // FireflyPlatform (app-level) replaced with string to avoid coupling
    };
    [SupportedMethod.SHARE]: {
        text: string;
    };
    [SupportedMethod.COMPOSE]: {
        text: string;
        activity: string;
        mentions: Mention[];
    };
    [SupportedMethod.BACK]: {};
    [SupportedMethod.CLOSE]: {};
    [SupportedMethod.SET_PRIMARY_BUTTON]: {
        text: string;
        loading?: boolean;
        disabled?: boolean;
        hidden?: boolean;
    };
    [SupportedMethod.SET_FRAME_READY_OPTIONS]: Partial<ReadyOptions>;
    [SupportedMethod.GET_FRAME_CONTEXT]: {};
    [SupportedMethod.SIGN_TRANSACTION]: {
        chainId: string;
        transaction: Transaction;
    };
    [SupportedMethod.SEND_TRANSACTION]: {
        chainId: string;
        transaction: Transaction;
    };
    [SupportedMethod.SIGN_MESSAGE]: {
        chainId: string;
        address: string;
        message: string;
    };
    [SupportedMethod.SIGN_TYPED_DATA]: {
        chainId: string;
        address: string;
        message: string;
    };
    [SupportedMethod.ADD_ETHEREUM_CHAIN]: Chain;
    [SupportedMethod.SWITCH_ETHEREUM_CHAIN]: {
        chainId: string;
    };
    [SupportedMethod.SEND_EVM_TRANSACTION]: {
        chainId: string;
        transaction: {
            from: Address;
            to: Address;
            data: Hex;
            value: string;
        };
    };
    [SupportedMethod.SEND_SOLANA_TRANSACTION]: {
        transaction: {
            from: string;
            to: string;
            data: string;
        };
    };
    [SupportedMethod.LOGIN_OR_BIND_EMAIL]: {};
    [SupportedMethod.FUND_PRIVY_ACCOUNT]: {
        status: 'completed' | 'cancelled';
        address: string;
        fundingMethod?: 'moonpay' | 'coinbase-onramp' | 'external';
        transactionHash?: string;
        amount?: string;
        assetType?: string;
        metadata?: {
            walletClientType?: string;
        };
    };
}

type StringifyBoolean = 'true' | 'false';

// Minimal FrameV2 shape to avoid app-level dependencies
interface FrameV2 {
    x_url: string;
    x_version: 2;
    x_manifest?: unknown | null;
    version: string;
    imageUrl: string;
    button: {
        title: string;
        action: {
            type: 'launch_frame';
            name: string;
            url: string;
            splashImageUrl: string;
            splashBackgroundColor: string;
        };
    };
}

export interface ResponseResult {
    [SupportedMethod.GET_SUPPORTED_METHODS]: SupportedMethod[];
    [SupportedMethod.GET_AUTHORIZATION]: string;
    [SupportedMethod.GET_THEME]: Theme;
    [SupportedMethod.GET_LANGUAGE]: string;
    [SupportedMethod.GET_WALLET_ADDRESS]: string[];
    [SupportedMethod.CONNECT_WALLET]: string;
    [SupportedMethod.BIND_WALLET]: string;
    [SupportedMethod.UPDATE_NAVIGATOR_BAR]: void;
    [SupportedMethod.OPEN_URL]: void;
    [SupportedMethod.ADD_CALENDAR]: void;
    [SupportedMethod.IS_TWITTER_USER_FOLLOWING]: StringifyBoolean;
    [SupportedMethod.FOLLOW_TWITTER_USER]: StringifyBoolean;
    [SupportedMethod.FOLLOW_LENS_USER]: StringifyBoolean;
    [SupportedMethod.FOLLOW_FARCASTER_USER]: StringifyBoolean;
    [SupportedMethod.LOGIN]: StringifyBoolean;
    [SupportedMethod.SHARE]: void;
    [SupportedMethod.COMPOSE]: void;
    [SupportedMethod.BACK]: void;
    [SupportedMethod.CLOSE]: void;
    [SupportedMethod.SET_PRIMARY_BUTTON]: void;
    [SupportedMethod.SET_FRAME_READY_OPTIONS]: void;
    [SupportedMethod.GET_FRAME_CONTEXT]: PartialWith<Context.MiniAppContext, 'client'> & {
        frame: {
            content: FrameV2;
            originalUrl: string;
        };
    };
    [SupportedMethod.GET_CHAIN_ID]: string;
    [SupportedMethod.SIGN_TRANSACTION]: string;
    [SupportedMethod.SEND_TRANSACTION]: string;
    [SupportedMethod.SIGN_MESSAGE]: string;
    [SupportedMethod.SIGN_TYPED_DATA]: string;
    [SupportedMethod.ADD_ETHEREUM_CHAIN]: true;
    [SupportedMethod.SWITCH_ETHEREUM_CHAIN]: true;
    [SupportedMethod.SEND_EVM_TRANSACTION]: Hex;
    [SupportedMethod.SEND_SOLANA_TRANSACTION]: string;
    [SupportedMethod.LOGIN_OR_BIND_EMAIL]: string;
    [SupportedMethod.FUND_PRIVY_ACCOUNT]: void;
}

export interface EventPayload {
    [SupportedEvent.CHANGE_ACCOUNT]: {
        type: Network;
        address: string;
    };
    [SupportedEvent.CHANGE_CHAIN_ID]: {
        type: Network;
        chainId: string;
    };
    [SupportedEvent.WEBVIEW_DID_FINISH_LOAD]: {};
}
