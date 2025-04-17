import type { Context, FrameHost, ReadyOptions, SetPrimaryButton } from '@farcaster/frame-host';

import { SocialProfileCategory, Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { openWindow } from '@/helpers/openWindow.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
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
        return signInWithFarcaster(frame?.x_url ?? SITE_URL, `${this.context.user.fid}`, options.nonce);
    };

    swap: FrameHost['swap'] = (options) => {
        throw new Error('Not implemented');
    };

    composeCast: FrameHost['composeCast'] = (options) => {
        throw new Error('Not implemented');
    };

    viewProfile: FrameHost['viewProfile'] = async (options) => {
        const profileUrl = resolveProfileUrl(Source.Farcaster, `${options.fid}`, SocialProfileCategory.Feed);
        openWindow(profileUrl);
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
