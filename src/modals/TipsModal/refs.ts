import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type FireflyIdentity, type FireflyProfile } from '@/providers/types/Firefly.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export interface TipsModalOpenProps {
    identity: FireflyIdentity;
    profiles: FireflyProfile[];
    handle: string | null;
    pureWallet?: boolean;
    post?: Post;
}

export type TipsModalCloseProps = {} | void;

export type TipsModalRefType = SingletonModalRefCreator<TipsModalOpenProps, TipsModalCloseProps>;

export const TipsModalRef = new SingletonModal<TipsModalOpenProps, TipsModalCloseProps>();
