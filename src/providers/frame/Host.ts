import { type Context, type MiniAppHost, type ReadyOptions, type SetPrimaryButton } from '@farcaster/miniapp-host';
import { t } from '@lingui/core/macro';
import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { SOLANA_CHAIN_ID_IN_FIREFLY } from '@/constants/debank.js';
import { OkxProviderType, Source } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { SITE_URL } from '@/constants/index.js';
import { createDummyChannel } from '@/helpers/createDummyChannel.js';
import { delay } from '@/helpers/delay.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getProfileById } from '@/helpers/getProfileById.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { openWindow } from '@/helpers/openWindow.js';
import { parseCAIP19 } from '@/helpers/parseCAIP19.js';
import { ComposeModalRef } from '@/modals/ComposeModal.js';
import { RelayConfirmationPopoverRef } from '@/modals/FrameViewerModal/controls.js';
import { SwapModalRef } from '@/modals/SwapModal/SwapModal.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { FrameLoader } from '@/providers/frame/Loader.js';
import { captureFrameSignInEvent } from '@/providers/telemetry/captureFrameSignInEvent.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { signInWithFarcaster } from '@/providers/warpcast/signInWithFarcaster.js';
import type { FrameV2 } from '@/types/frame.js';

export class FarcasterFrameHost implements MiniAppHost {
    constructor(
        public context: Context.MiniAppContext,
        public options?: {
            debug?: boolean;
            frame?: () => FrameV2;
            ready?: (options?: Partial<ReadyOptions>) => void;
            close?: () => void;
            setPrimaryButton?: SetPrimaryButton;
            viewCast?: (hash: string) => void;
            viewProfile?: (profile: Profile) => void;
            openMiniApps?: (frame: FrameV2) => void;
            eip6963RequestProvider?: () => void;
        },
    ) {}

    addFrame: MiniAppHost['addFrame'] = () => {
        console.warn('[frame host]: addFrame');
        return Promise.resolve({});
    };

    addMiniApp: MiniAppHost['addMiniApp'] = () => {
        console.warn('[frame host]: addMiniApp');
        throw new NotImplementedError();
    };

    openMiniApp: MiniAppHost['openMiniApp'] = async (options) => {
        console.warn('[frame host]: openMiniApp', options);
        const frames = await FrameLoader.load([options.url]);
        const frame = first(frames)?.value;
        if (!frame) {
            enqueueWarningMessage(t`Failed to open miniapp`);
            return;
        }

        // TODO: request double confirmation from the user

        this.options?.openMiniApps?.(frame as FrameV2);
    };

    close: MiniAppHost['close'] = () => {
        console.warn('[frame host]: close');
        this.options?.close?.();
    };

    openUrl: MiniAppHost['openUrl'] = (url) => {
        console.warn('[frame host]: openUrl', url);
        openWindow(url);
    };

    ready: MiniAppHost['ready'] = (options) => {
        console.warn('[frame host]: ready');
        this.options?.ready?.(options);
    };

    setPrimaryButton: MiniAppHost['setPrimaryButton'] = (options) => {
        console.warn('[frame host]: setPrimaryButton', options);
        this.options?.setPrimaryButton?.(options);
    };

    signIn: MiniAppHost['signIn'] = async (options) => {
        const frame = this.options?.frame?.();
        if (!frame) throw new Error('Frame is not available');

        const fid = `${this.context.client.clientFid}`;

        // sign in with custody wallet
        const checked = await FireflyEndpointProvider.checkCustodyWallet(fid);
        if (checked) {
            const signed = await signInWithFarcaster(frame, fid, options);

            captureFrameSignInEvent('mnemonic', frame);

            return signed;
        }

        // sign in with auth wallet or relay server
        const signed = await RelayConfirmationPopoverRef.openAndWaitForClose({
            fid: this.context.client.clientFid,
            frame,
            options,
        });
        if (!signed) throw new Error('Failed to sign in farcaster');
        return signed;
    };

    signManifest: MiniAppHost['signManifest'] = async (options) => {
        throw new NotImplementedError();
    };

    viewToken: MiniAppHost['viewToken'] = async (options) => {
        const token = parseCAIP19(options.token);

        const chainId = token.chainReference;
        switch (token.namespace) {
            case 'erc20':
                openWindow(`${SITE_URL}/token/${token.reference}?chainId=${chainId}`);
                break;
            case 'erc721':
                openWindow(`${SITE_URL}/nft/${chainId}/${token.reference}${token.tokenId ? `/${token.tokenId}` : ''}`);
                break;
            default:
                throw new Error(`Unsupported token type of namespace = ${token.namespace}`);
        }
    };

    sendToken: MiniAppHost['sendToken'] = async (options) => {
        console.warn('[frame host]: sendToken', options);
        throw new NotImplementedError();
    };

    swapToken: MiniAppHost['swapToken'] = async (options) => {
        const buyToken = options.buyToken ? parseCAIP19(options.buyToken) : undefined;
        const sellToken = options.sellToken ? parseCAIP19(options.sellToken) : undefined;
        if (!buyToken && !sellToken) {
            console.warn('[frame host]: swapToken', options);
            return { success: false, reason: 'swap_failed' };
        }
        const originChainId = buyToken?.chainReference || sellToken?.chainReference;
        if (!originChainId) {
            console.warn('No chain id', options);
            return { success: false, reason: 'swap_failed' };
        }
        const chainId = Number.parseInt(originChainId, 10);
        const buyTokenAddress = buyToken?.reference;
        const sellTokenAddress = sellToken?.reference;
        const address = buyTokenAddress || sellTokenAddress;

        const providerType =
            chainId !== SOLANA_CHAIN_ID_IN_FIREFLY || isValidAddressEthereum(address)
                ? OkxProviderType.EVM
                : OkxProviderType.SOLANA;

        // await for modal to register
        await delay(1000);
        SwapModalRef.open({
            providerType,
            chainId,
            fromToken: sellTokenAddress || undefined,
            toToken: buyTokenAddress,
        });

        // TODO We can't get the result of the swap from OKX widget yet.
        return {
            success: true,
            swap: {
                transactions: [],
            },
        };
    };

    viewCast: MiniAppHost['viewCast'] = async (options) => {
        console.warn('[frame host]: viewCast', options);

        const u = `/post/farcaster/${options.hash}`;

        if (this.options?.viewCast) {
            this.options.viewCast(options.hash);
        } else {
            openWindow(urlcat(SITE_URL, u));
        }
    };

    // @ts-ignore
    composeCast: MiniAppHost['composeCast'] = async (options) => {
        console.warn('[frame host]: composeCast', options);
        const result = await ComposeModalRef.openAndWaitForClose({
            source: Source.Farcaster,
            type: 'compose',
            chars: options.text,
            embeds: options.embeds,
            channel: options.channelKey ? createDummyChannel(Source.Farcaster, options.channelKey) : undefined,
            post: options.parent ? await FireflySocialMediaProvider.getPostById(options.parent.hash) : undefined,
        });

        if (options.close) {
            this.close();
            return;
        }

        if (!result)
            return {
                cast: null,
            };

        return {
            cast: {
                hash: result.post?.postId[Source.Farcaster],
            },
        };
    };

    viewProfile: MiniAppHost['viewProfile'] = async (options) => {
        console.warn('[frame host]: viewProfile', options);

        const profile = await getProfileById(Source.Farcaster, `${options.fid}`);
        if (!profile) {
            enqueueWarningMessage(t`No profile found`);
            return;
        }

        if (this.options?.viewProfile) {
            this.options?.viewProfile?.(profile);
        } else {
            openWindow(getProfileUrl(profile));
        }
    };

    ethProviderRequest: MiniAppHost['ethProviderRequest'] = (payload) => {
        console.warn('[frame host]: ethProviderRequest', payload);
        throw new NotImplementedError();
    };

    ethProviderRequestV2: MiniAppHost['ethProviderRequestV2'] = (payload) => {
        console.warn('[frame host]: ethProviderRequestV2', payload);
        throw new NotImplementedError();
    };

    eip6963RequestProvider: MiniAppHost['eip6963RequestProvider'] = () => {
        this.options?.eip6963RequestProvider?.();
    };

    impactOccurred: MiniAppHost['impactOccurred'] = () => {
        console.warn('[frame host]: impactOccurred');
        throw new NotImplementedError();
    };

    notificationOccurred: MiniAppHost['notificationOccurred'] = () => {
        console.warn('[frame host]: notificationOccurred');
        throw new NotImplementedError();
    };

    selectionChanged: MiniAppHost['selectionChanged'] = () => {
        console.warn('[frame host]: selectionChanged');
        throw new NotImplementedError();
    };

    getCapabilities: MiniAppHost['getCapabilities'] = () => {
        console.warn('[frame host]: getCapabilities');
        return Promise.resolve([
            'wallet.getEthereumProvider',
            'wallet.getSolanaProvider',
            'actions.ready',
            'actions.openUrl',
            'actions.close',
            'actions.setPrimaryButton',
            // 'actions.addMiniApp',
            'actions.signIn',
            'actions.viewCast',
            'actions.viewProfile',
            'actions.composeCast',
            'actions.viewToken',
            // 'actions.sendToken',
            // 'actions.swapToken',
            'actions.openMiniApp',
            // 'haptics.impactOccurred',
            // 'haptics.notificationOccurred',
            // 'haptics.selectionChanged',
            // 'back',
        ]);
    };

    getChains: MiniAppHost['getChains'] = () => {
        console.warn('[frame host]: getChains');
        throw new NotImplementedError();
    };

    updateBackState: MiniAppHost['updateBackState'] = () => {
        console.warn('[frame host]: updateBackState');
        throw new NotImplementedError();
    };

    requestCameraAndMicrophoneAccess: MiniAppHost['requestCameraAndMicrophoneAccess'] = () => {
        console.warn('[frame host]: requestCameraAndMicrophoneAccess');
        return Promise.resolve();
    };
}
