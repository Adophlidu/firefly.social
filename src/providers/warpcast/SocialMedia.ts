import urlcat from 'urlcat';

import { NotImplementedError } from '@/constants/error.js';
import { WARPCAST_ROOT_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { formatFarcasterChannelFromWarpcast } from '@/helpers/formatFarcasterChannelFromWarpcast.js';
import { getWarpcastAuthToken } from '@/helpers/getWarpcastAuthToken.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import type { NotificationSettings, WalletProfile } from '@/providers/types/Firefly.js';
import type { Session } from '@/providers/types/Session.js';
import {
    type Channel,
    type Friendship,
    NetworkType,
    type Notification,
    type Post,
    type Profile,
    type ProfileBadge,
    type ProfileEditable,
    type Provider,
    SessionType,
} from '@/providers/types/SocialMedia.js';
import { type Channel as WarpcastChannel } from '@/providers/types/Warpcast.js';
import type { ResponseJSON } from '@/types/index.js';

class WarpcastSocialMedia implements Provider {
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

    quotePost(postId: string, post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    collectPost(postId: string, collectionId?: string): Promise<void> {
        throw new NotImplementedError();
    }

    getProfilesByAddress(address: string): Promise<Profile[]> {
        throw new NotImplementedError();
    }

    getProfilesByIds(ids: string[]): Promise<Profile[]> {
        throw new NotImplementedError();
    }

    getProfileByHandle(handle: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    getProfileBySession(session: Session): Promise<Profile> {
        throw new NotImplementedError();
    }

    getCommentsById(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getThreadByPostId(postId: string, localPost?: Post): Promise<Post[]> {
        throw new NotImplementedError();
    }

    async getChannelById(channelId: string, includeFollowingStatus = false): Promise<Channel> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(WARPCAST_ROOT_URL, '/v1/channel', {
                channelId,
            });
            const { result } = await farcasterSessionHolder.fetch<{ result: { channel: WarpcastChannel } }>(url);
            const channel = result.channel;
            if (!channel) throw new Error('Channel not found');

            const formattedChannel = formatFarcasterChannelFromWarpcast(channel);
            if (session?.profileId && includeFollowingStatus) {
                const response = await runInSafeAsync(() =>
                    farcasterSessionHolder.fetch<{ result: { following: boolean } }>(
                        urlcat(WARPCAST_ROOT_URL, '/v1/user-channel', {
                            fid: session.profileId,
                            channelId,
                        }),
                    ),
                );
                formattedChannel.isMember = response?.result.following ?? false;
            }

            return formattedChannel;
        });
    }

    getChannelsByIds(ids: string[]): Promise<Channel[]> {
        throw new NotImplementedError();
    }

    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat('/api/warpcast/channel/members', {
                channelId,
                limit: 25,
                cursor: indicator?.id,
                fid: session?.profileId,
            });
            const data = await fetchJSON<ResponseJSON<{ members: Profile[]; cursor?: string }>>(url, { method: 'GET' });
            if (!data.success) throw new Error(data.error.message);

            return createPageable(
                data.data.members,
                createIndicator(indicator),
                data.data.cursor ? createNextIndicator(indicator, data.data.cursor) : undefined,
            );
        });
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat('/api/warpcast/channel/followers', {
                channelId,
                limit: 25,
                cursor: indicator?.id,
                fid: session?.profileId,
            });
            const data = await fetchJSON<ResponseJSON<{ followers: Profile[]; cursor?: string }>>(url, {
                method: 'GET',
            });
            if (!data.success) throw new Error(data.error.message);

            return createPageable(
                data.data.followers,
                createIndicator(indicator),
                data.data.cursor ? createNextIndicator(indicator, data.data.cursor) : undefined,
            );
        });
    }

    getChannelByHandle(channelHandle: string): Promise<Channel> {
        throw new NotImplementedError();
    }

    async getChannelFollowStatus(channelId: string, fid: string): Promise<boolean> {
        const result = await fetchJSON<ResponseJSON<{ following: boolean }>>(
            urlcat('/api/warpcast/channel/follow/status', {
                channelId,
                fid,
            }),
        );
        if (!result.success) throw new Error(result.error.message);

        return result.data.following;
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

    getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getHiddenComments(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    actPost(postId: string, options: unknown): Promise<void> {
        throw new NotImplementedError();
    }

    getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
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

    async reportProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async reportPost(post: Post): Promise<boolean> {
        throw new NotImplementedError();
    }
    async blockProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async unblockProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async blockChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async unblockChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async getBlockedChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    get type() {
        return SessionType.Farcaster;
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async discoverPostsById(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getPostById(postId: string): Promise<Post> {
        throw new NotImplementedError();
    }

    async getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    async getProfileById(profileId: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    async getLikeReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getRepostReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async isFollowedByMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async isFollowingMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    async getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    async getPostsLiked(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    async getPostsReplies(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    async getPostsBeMentioned(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    async publishPost(post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    async deletePost(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async upvotePost(postId: string) {
        throw new NotImplementedError();
    }

    async unvotePost(postId: string) {
        throw new NotImplementedError();
    }

    async commentPost(postId: string, post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    async mirrorPost(postId: string): Promise<string> {
        throw new NotImplementedError();
    }

    async unmirrorPost(postId: string) {
        throw new NotImplementedError();
    }

    async follow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async unfollow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async searchPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getSuggestedFollows(indicator?: PageIndicator): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    async getNotifications(indicator?: PageIndicator): Promise<Pageable<Notification, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        throw new NotImplementedError();
    }

    async setNotificationSettings(settings: NotificationSettings): Promise<boolean> {
        throw new NotImplementedError();
    }

    async bookmark(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async unbookmark(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        throw new NotImplementedError();
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        const authToken = await getWarpcastAuthToken();
        const url = urlcat('/api/warpcast/channel/follow', {
            channelId: channel.id,
        });
        await farcasterSessionHolder.fetch(url, {
            method: 'POST',
            headers: {
                'X-Token': authToken,
            },
        });

        return true;
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        const authToken = await getWarpcastAuthToken();
        const url = urlcat('/api/warpcast/channel/follow', {
            channelId: channel.id,
        });
        await farcasterSessionHolder.fetch(url, {
            method: 'DELETE',
            headers: {
                'X-Token': authToken,
            },
        });

        return true;
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
}

export const WarpcastSocialMediaProvider = new WarpcastSocialMedia();
