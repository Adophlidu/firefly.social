import type { Context, ReadyOptions } from '@farcaster/miniapp-host';

import type { FireflyPlatform } from '@/constants/enum.js';
import type { FrameV2 } from '@/types/frame.js';
import type { PartialWith } from '@/types/utility.js';

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
    UPDATE_NAVIGATOR_BAR = 'updateNavigatorBar',
    OPEN_URL = 'openUrl',
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
    platform: FireflyPlatform;
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
        id: string; // e.g., 952921795316912133
    };
    [SupportedMethod.UPDATE_NAVIGATOR_BAR]: {
        show: boolean;
        title: string;
    };
    [SupportedMethod.OPEN_URL]: {
        url: string;
    };
    [SupportedMethod.LOGIN]: {
        platform: FireflyPlatform;
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
}

type StringifyBoolean = 'true' | 'false';

export interface ResponseResult {
    [SupportedMethod.GET_SUPPORTED_METHODS]: SupportedMethod[];
    [SupportedMethod.GET_AUTHORIZATION]: string;
    [SupportedMethod.GET_THEME]: Theme;
    [SupportedMethod.GET_LANGUAGE]: string;
    [SupportedMethod.GET_WALLET_ADDRESS]: string[];
    [SupportedMethod.CONNECT_WALLET]: string;
    [SupportedMethod.BIND_WALLET]: string; // address
    [SupportedMethod.UPDATE_NAVIGATOR_BAR]: void;
    [SupportedMethod.OPEN_URL]: void;
    [SupportedMethod.BIND_WALLET]: string; // address
    [SupportedMethod.IS_TWITTER_USER_FOLLOWING]: StringifyBoolean;
    [SupportedMethod.FOLLOW_TWITTER_USER]: StringifyBoolean;
    [SupportedMethod.UPDATE_NAVIGATOR_BAR]: void;
    [SupportedMethod.OPEN_URL]: void;
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
    [SupportedMethod.GET_CHAIN_ID]: string; // hex string
    [SupportedMethod.SIGN_TRANSACTION]: string;
    [SupportedMethod.SEND_TRANSACTION]: string;
    [SupportedMethod.SIGN_MESSAGE]: string;
    [SupportedMethod.SIGN_TYPED_DATA]: string;
    [SupportedMethod.ADD_ETHEREUM_CHAIN]: true;
    [SupportedMethod.SWITCH_ETHEREUM_CHAIN]: true;
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
