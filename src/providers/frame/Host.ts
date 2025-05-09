import type { Context, FrameHost, ReadyOptions, SetPrimaryButton } from '@farcaster/frame-host';

import { Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { openProfilePageByProfileId } from '@/helpers/openProfilePageById.js';
import { openWindow } from '@/helpers/openWindow.js';
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
        return Promise.resolve({});
    };

    close: FrameHost['close'] = () => {
        this.options?.close?.();
    };

    openUrl: FrameHost['openUrl'] = (url) => {
        openWindow(url);
    };

    ready: FrameHost['ready'] = (options) => {
        this.options?.ready?.(options);
    };

    setPrimaryButton: FrameHost['setPrimaryButton'] = (options) => {
        this.options?.setPrimaryButton?.(options);
    };

    signIn: FrameHost['signIn'] = async (options) => {
        const profile = useFarcasterStateStore.getState().currentProfile;
        if (!profile) throw new Error('No profile found. Please log in to Farcaster.');

        const frame = this.options?.frame?.();
        const signature = await signInWithFarcaster(
            frame?.x_url ?? SITE_URL,
            `${this.context.user.fid}`,
            options.nonce,
        );
        return signature;
    };

    swap: FrameHost['swap'] = (options) => {
        throw new Error('Not implemented');
    };

    composeCast: FrameHost['composeCast'] = (options) => {
        throw new Error('Not implemented');
    };

    viewProfile: FrameHost['viewProfile'] = async (options) => {
        await openProfilePageByProfileId(Source.Farcaster, `${options.fid}`);
    };

    viewToken: FrameHost['viewToken'] = (options) => {
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
