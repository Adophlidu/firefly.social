/* cspell:disable */

import { EMPTY_LIST } from '@dimensiondev/constants';
import { NotImplementedError } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { MessageType, ReactionType } from '@/constants/farcaster.js';
import { NEYNAR_URL } from '@/constants/static.js';
import { fetchNeynarJson } from '@/helpers/fetchNeynarJson.js';
import type { Pageable, PageIndicator } from '@/helpers/pageable.js';
import { resolveNeynarResponseData } from '@/helpers/resolveNeynarResponseData.js';
import { farcasterPostIdToHash } from '@/providers/farcaster/farcasterPostIdToHash.js';
import { formatChannelFromFirefly } from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { publishMessage } from '@/providers/firefly/farcaster-hub/publishMessage.js';
import { encodeMessageData } from '@/providers/neynar/encodeMessageData.js';
import { publishPost } from '@/providers/neynar/publishPost.js';
import { quotePost } from '@/providers/neynar/quotePost.js';
import { searchProfiles } from '@/providers/neynar/searchProfiles.js';
import type { Account } from '@/providers/types/Account.js';
import type { Channel as FireflyChannel, NotificationSettings, WalletProfile } from '@/providers/types/Firefly.js';
import type { Session } from '@/providers/types/Session.js';
import {
    type Channel,
    type Friendship,
    type NetworkType,
    type Notification,
    type Post,
    type Profile,
    type ProfileBadge,
    type ProfileEditable,
    type ProfileForSignup,
    type Provider,
    SessionType,
} from '@/providers/types/SocialMedia.js';

class NeynarSocialMedia implements Provider {
    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    blockWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }

    unblockWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }

    getBlockedWallets(indicator?: PageIndicator): Promise<Pageable<WalletProfile, PageIndicator>> {
        throw new NotImplementedError();
    }

    watchWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }

    unwatchWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }

    reportChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getFriendship(profileId: string): Promise<Friendship | null> {
        throw new NotImplementedError();
    }

    async mirrorPost(postId: string, authorId?: number): Promise<string> {
        if (!authorId) throw new Error('Failed to recast post');

        const { messageJson } = await encodeMessageData({
            type: MessageType.REACTION_ADD,
            reactionBody: {
                type: ReactionType.RECAST,
                targetCastId: {
                    fid: authorId,
                    hash: farcasterPostIdToHash(postId),
                },
            },
        });
        await publishMessage(messageJson);
        // FIXME: should return post id here
        return null!;
    }

    async unmirrorPost(postId: string, authorId?: number): Promise<void> {
        if (!authorId) throw new Error('Failed to unmirror post.');

        const { messageJson } = await encodeMessageData({
            type: MessageType.REACTION_REMOVE,
            reactionBody: {
                type: ReactionType.RECAST,
                targetCastId: {
                    fid: authorId,
                    hash: farcasterPostIdToHash(postId),
                },
            },
        });
        await publishMessage(messageJson);
        return;
    }

    async quotePost(postId: string, post: Post, authorId?: number): Promise<{ postId: string }> {
        return quotePost(postId, post, authorId);
    }

    collectPost(postId: string, collectionId?: string): Promise<void> {
        throw new NotImplementedError();
    }

    isFollowedByMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    isFollowingMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async commentPost(postId: string, post: Post): Promise<{ postId: string }> {
        return publishPost(post);
    }

    async deletePost(postId: string): Promise<boolean> {
        const { messageJson } = await encodeMessageData({
            type: MessageType.CAST_REMOVE,
            castRemoveBody: {
                targetHash: farcasterPostIdToHash(postId),
            },
        });
        await publishMessage(messageJson);
        return true;
    }

    getChannelById(channelId: string): Promise<Channel> {
        throw new NotImplementedError();
    }

    getChannelByHandle(channelHandle: string): Promise<Channel> {
        throw new NotImplementedError();
    }

    getChannelsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsByChannelHandle(channelHandle: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    getHiddenComments(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    actPost(postId: string, options: unknown): Promise<void> {
        throw new NotImplementedError();
    }

    getCollectedPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getLikedPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getRepliesPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async publishPost(post: Post): Promise<{ postId: string }> {
        return publishPost(post);
    }

    async upvotePost(postId: string, authorId?: number): Promise<void> {
        if (!authorId) throw new Error('Failed to upvote post.');

        const { messageJson } = await encodeMessageData({
            type: MessageType.REACTION_ADD,
            reactionBody: {
                type: ReactionType.LIKE,
                targetCastId: {
                    fid: authorId,
                    hash: farcasterPostIdToHash(postId),
                },
            },
        });
        await publishMessage(messageJson);
        return;
    }

    async unvotePost(postId: string, authorId?: number): Promise<void> {
        if (!authorId) throw new Error('Failed to unvote post.');

        const { messageJson } = await encodeMessageData({
            type: MessageType.REACTION_REMOVE,
            reactionBody: {
                type: ReactionType.LIKE,
                targetCastId: {
                    fid: authorId,
                    hash: farcasterPostIdToHash(postId),
                },
            },
        });
        await publishMessage(messageJson);
        return;
    }

    getProfileByHandle(handle: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    getProfileBySession(session: Session): Promise<Profile> {
        throw new NotImplementedError();
    }

    getPostById(postId: string): Promise<Post> {
        throw new NotImplementedError();
    }

    getCommentsById(postId: string): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    discoverPosts(): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    discoverPostsById(profileId: string): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsByProfileId(profileId: string): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getPostsBeMentioned(profileId: string): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getPostsLiked(profileId: string): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getPostsReplies(profileId: string): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    async follow(profileId: string): Promise<boolean> {
        const { messageJson } = await encodeMessageData({
            type: MessageType.LINK_ADD,
            linkBody: {
                type: 'follow',
                targetFid: Number(profileId),
            },
        });
        await publishMessage(messageJson);
        return true;
    }

    async unfollow(profileId: string): Promise<boolean> {
        const { messageJson } = await encodeMessageData({
            type: MessageType.LINK_REMOVE,
            linkBody: {
                type: 'follow',
                targetFid: Number(profileId),
            },
        });
        await publishMessage(messageJson);
        return true;
    }

    getFollowers(profileId: string): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    getFollowings(profileId: string): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getNotifications(_highSignalFilter?: boolean, _indicator?: PageIndicator): Promise<Pageable<Notification>> {
        throw new NotImplementedError();
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        throw new NotImplementedError();
    }

    async setNotificationSettings(settings: NotificationSettings): Promise<boolean> {
        throw new NotImplementedError();
    }

    getSuggestedFollows(
        _includeFollowingStatus?: boolean,
        _locale?: unknown,
        _indicator?: PageIndicator,
    ): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    searchPosts(q: string, _fullMatch?: boolean, _indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getThreadByPostId(postId: string): Promise<Post[]> {
        throw new NotImplementedError();
    }

    blockProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unblockProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    blockChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unblockChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getBlockedChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    getLikeReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getRepostReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    bookmark(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unbookmark(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    reportProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    reportPost(post: Post): Promise<boolean> {
        throw new NotImplementedError();
    }

    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        throw new NotImplementedError();
    }

    getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        throw new NotImplementedError();
    }

    get type() {
        return SessionType.Farcaster;
    }

    getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    async getProfileById(profileId: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        throw new NotImplementedError();
    }

    async getChannelsByIds(ids: string[]): Promise<Channel[]> {
        if (!ids.length) return EMPTY_LIST;

        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(NEYNAR_URL, '/v2/farcaster/channel/bulk', {
                ids: ids.join(','),
                viewer_fid: session?.profileId,
            });

            const response = await fetchNeynarJson<{ channels: FireflyChannel[] }>(url);
            const data = resolveNeynarResponseData(response);
            return data.channels.map(formatChannelFromFirefly);
        });
    }

    async searchProfiles(q: string, indicator?: PageIndicator) {
        return searchProfiles(q, indicator);
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    async getPinnedPost(profileId: string): Promise<Post | null> {
        throw new NotImplementedError();
    }

    async decryptPost(post: Post): Promise<Post> {
        throw new NotImplementedError();
    }

    async getMediaPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async createAccount(profile: ProfileForSignup): Promise<Account> {
        throw new NotImplementedError();
    }
}

export { NeynarSocialMedia };
export const neynarSocialMediaProvider = new NeynarSocialMedia();
