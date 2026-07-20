import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { FireflyIdentity, FireflyProfile, FireflyTipsProfile } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Token } from '@/providers/types/Transfer.js';

export interface TipsSuccessResult {
    amount: string;
    hash: string;
    recipient: FireflyTipsProfile;
    token: Token;
}

export interface TipsModalOpenProps {
    identity: FireflyIdentity;
    profiles: FireflyProfile[];
    handle: string | null;
    pureWallet?: boolean;
    post?: Post;
    closeOnSuccess?: boolean;
    onSuccess?: (result: TipsSuccessResult) => Promise<void> | void;
}

export type TipsModalCloseProps = {} | void;

export type TipsModalRefType = SingletonModalRefCreator<TipsModalOpenProps, TipsModalCloseProps>;

export const TipsModalRef = new SingletonModal<TipsModalOpenProps, TipsModalCloseProps>();
