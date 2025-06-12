import type { Context, FrameHost, ReadyOptions, SetPrimaryButton } from '@farcaster/frame-host';

import { Source } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { SITE_URL } from '@/constants/index.js';
import { openProfilePageByProfileId } from '@/helpers/openProfilePageById.js';
import { openWindow } from '@/helpers/openWindow.js';
import { ComposeModalRef } from '@/modals/controls.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { signInWithFarcaster, signInWithRelay } from '@/services/signInWithFarcaster.js';
import type { FrameV2 } from '@/types/frame.js';

export class FarcasterFrameHost implements FrameHost {
    constructor(
        public context: Context.FrameContext,
        private options?: {
            debug?: boolean;
            frame?: () => FrameV2;
            ready?: (options?: Partial<ReadyOptions>) => void;
            close?: () => void;
            setPrimaryButton?: SetPrimaryButton;
        },
    ) {}

    addFrame: FrameHost['addFrame'] = () => {
        console.warn('[frame host]: addFrame');
        return Promise.resolve({});
    };

    close: FrameHost['close'] = () => {
        console.warn('[frame host]: close');
        this.options?.close?.();
    };

    openUrl: FrameHost['openUrl'] = (url) => {
        console.warn('[frame host]: openUrl', url);
        openWindow(url);
    };

    ready: FrameHost['ready'] = (options) => {
        console.warn('[frame host]: ready');
        this.options?.ready?.(options);
    };

    setPrimaryButton: FrameHost['setPrimaryButton'] = (options) => {
        console.warn('[frame host]: setPrimaryButton', options);
        this.options?.setPrimaryButton?.(options);
    };

    signIn: FrameHost['signIn'] = async (options) => {
        console.log('DEBUG: [frame host]: signIn', options);

        try {
            const frame = this.options?.frame?.();
            if (!frame) throw new Error('Frame is not available');

            const checked = await FireflyEndpointProvider.checkCustodyWallet(`${this.context.client.clientFid}`);
            if (!checked) {
                return await signInWithRelay(frame, frame?.x_url ?? SITE_URL, options.nonce);
            } else {
                return await signInWithFarcaster(
                    frame?.x_url ?? SITE_URL,
                    `${this.context.client.clientFid}`,
                    options.nonce,
                );
            }
        } catch (error) {
            console.log('DEBUG: [frame host]: signIn error', error);
            throw error;
        }
    };

    sendToken: FrameHost['sendToken'] = async (options) => {
        console.warn('[frame host]: sendToken', options);
        throw new NotImplementedError();
    };

    swapToken: FrameHost['swapToken'] = async (options) => {
        console.warn('[frame host]: swapToken', options);
        throw new NotImplementedError();
    };

    viewCast: FrameHost['viewCast'] = async (options) => {
        console.warn('[frame host]: viewCast', options);
        throw new NotImplementedError();
    };

    // @ts-ignore
    composeCast: FrameHost['composeCast'] = async (options) => {
        console.warn('[frame host]: composeCast', options);
        const result = await ComposeModalRef.openAndWaitForClose({
            source: Source.Farcaster,
            type: 'compose',
            chars: options.text,
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

    viewProfile: FrameHost['viewProfile'] = async (options) => {
        console.warn('[frame host]: viewProfile', options);
        await openProfilePageByProfileId(Source.Farcaster, `${options.fid}`);
    };

    viewToken: FrameHost['viewToken'] = (options) => {
        console.warn('[frame host]: viewToken', options);
        return Promise.resolve();
    };

    ethProviderRequest: FrameHost['ethProviderRequest'] = (payload) => {
        console.warn('[frame host]: ethProviderRequest', payload);
        throw new NotImplementedError();
    };

    ethProviderRequestV2: FrameHost['ethProviderRequestV2'] = (payload) => {
        console.warn('[frame host]: ethProviderRequestV2', payload);
        throw new NotImplementedError();
    };

    eip6963RequestProvider: FrameHost['eip6963RequestProvider'] = () => {
        throw new NotImplementedError();
    };

    impactOccurred: FrameHost['impactOccurred'] = () => {
        console.warn('[frame host]: impactOccurred');
        throw new NotImplementedError();
    };

    notificationOccurred: FrameHost['notificationOccurred'] = () => {
        console.warn('[frame host]: notificationOccurred');
        throw new NotImplementedError();
    };

    selectionChanged: FrameHost['selectionChanged'] = () => {
        console.warn('[frame host]: selectionChanged');
        throw new NotImplementedError();
    };

    getCapabilities: FrameHost['getCapabilities'] = () => {
        console.warn('[frame host]: getCapabilities');
        throw new NotImplementedError();
    };

    getChains: FrameHost['getChains'] = () => {
        console.warn('[frame host]: getChains');
        throw new NotImplementedError();
    };

    updateBackState: FrameHost['updateBackState'] = () => {
        console.warn('[frame host]: updateBackState');
        throw new NotImplementedError();
    };
}
