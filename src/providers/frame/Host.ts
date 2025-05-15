import type { Context, FrameHost, ReadyOptions, SetPrimaryButton } from '@farcaster/frame-host';

import { Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { openProfilePageByProfileId } from '@/helpers/openProfilePageById.js';
import { openWindow } from '@/helpers/openWindow.js';
import { ComposeModalRef } from '@/modals/controls.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { signInWithFarcaster } from '@/services/signInWithFarcaster.js';
import { useFarcasterStateStore } from '@/store/useProfileStore.js';
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
        const profile = useFarcasterStateStore.getState().currentProfile;
        if (!profile) throw new Error('No profile found. Please log in to Farcaster.');

        console.log('DEBUG: [frame host]: signIn', options);

        const frame = this.options?.frame?.();
        const signature = await signInWithFarcaster(
            frame?.x_url ?? SITE_URL,
            `${this.context.user.fid}`,
            options.nonce,
        );
        return signature;
    };

    swap: FrameHost['swap'] = (options) => {
        console.warn('[frame host]: swap', options);
        throw new Error('Not implemented');
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

        if (!result) return;

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

    ethProviderRequest: FrameHost['ethProviderRequest'] = () => {
        throw new Error('Not implemented');
    };

    ethProviderRequestV2: FrameHost['ethProviderRequestV2'] = () => {
        throw new Error('Not implemented');
    };

    eip6963RequestProvider: FrameHost['eip6963RequestProvider'] = () => {
        throw new Error('Not implemented');
    };
}
