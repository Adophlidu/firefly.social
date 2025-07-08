import type { Context, MiniAppHost, ReadyOptions, SetPrimaryButton } from '@farcaster/miniapp-host';
import { t } from '@lingui/core/macro';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { SITE_URL } from '@/constants/index.js';
import { createDummyChannel } from '@/helpers/createDummyChannel.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getProfileById } from '@/helpers/getProfileById.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { openWindow } from '@/helpers/openWindow.js';
import { ComposeModalRef } from '@/modals/controls.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { signInWithFarcaster } from '@/providers/warpcast/signInWithFarcaster.js';
import { signInWithRelay } from '@/providers/warpcast/signInWithRelay.js';
import type { FrameV2 } from '@/types/frame.js';

export class FarcasterFrameHost implements MiniAppHost {
    constructor(
        public context: Context.MiniAppContext,
        private options?: {
            debug?: boolean;
            frame?: () => FrameV2;
            ready?: (options?: Partial<ReadyOptions>) => void;
            close?: () => void;
            setPrimaryButton?: SetPrimaryButton;
            viewCast?: (hash: string) => void;
            viewProfile?: (profile: Profile) => void;
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

    openMiniApp: MiniAppHost['openMiniApp'] = (options) => {
        console.warn('[frame host]: openMiniApp', options);
        throw new NotImplementedError();
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
        console.log('DEBUG: [frame host]: signIn', JSON.stringify(options, null, 2));

        try {
            const frame = this.options?.frame?.();
            if (!frame) throw new Error('Frame is not available');

            const fid = `${this.context.client.clientFid}`;

            // sign in with custody wallet
            const checked = await FireflyEndpointProvider.checkCustodyWallet(fid);
            if (checked) return await signInWithFarcaster(frame, fid, options);

            // sign in with relay server
            return await signInWithRelay(frame, options);
        } catch (error) {
            console.log('DEBUG: [frame host]: signIn error', error);
            throw error;
        }
    };

    sendToken: MiniAppHost['sendToken'] = async (options) => {
        console.warn('[frame host]: sendToken', options);
        throw new NotImplementedError();
    };

    swapToken: MiniAppHost['swapToken'] = async (options) => {
        console.warn('[frame host]: swapToken', options);
        throw new NotImplementedError();
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

    viewToken: MiniAppHost['viewToken'] = (options) => {
        console.warn('[frame host]: viewToken', options);
        return Promise.resolve();
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
        throw new NotImplementedError();
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
        throw new NotImplementedError();
    };

    getChains: MiniAppHost['getChains'] = () => {
        console.warn('[frame host]: getChains');
        throw new NotImplementedError();
    };

    updateBackState: MiniAppHost['updateBackState'] = () => {
        console.warn('[frame host]: updateBackState');
        throw new NotImplementedError();
    };
}
