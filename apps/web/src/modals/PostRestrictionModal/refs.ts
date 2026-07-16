import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { LensClubJoinOutcome } from '@/providers/lens/requestLensChannelMembership.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export interface PostRestrictionModalOpenProps {
    channel: Channel;
}

export type PostRestrictionModalCloseProps = LensClubJoinOutcome | undefined;

export type PostRestrictionModalRefType = SingletonModalRefCreator<
    PostRestrictionModalOpenProps,
    PostRestrictionModalCloseProps
>;

export const PostRestrictionModalRef = new SingletonModal<
    PostRestrictionModalOpenProps,
    PostRestrictionModalCloseProps
>();
