import urlcat from 'urlcat';

import { NotImplementedError } from '@/constants/error.js';
import { WARPCAST_ROOT_URL_V1 } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { formatFarcasterChannelFromWarpcast } from '@/providers/farcaster/formatFarcasterChannelFromWarpcast.js';
import { getFarcasterAuthToken } from '@/providers/farcaster/getFarcasterAuthToken.js';
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
import type { ResponseJson } from '@/types/utility.js';

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
            const url = urlcat(WARPCAST_ROOT_URL_V1, '/channel', {
                channelId,
            });
            const { result } = await farcasterSessionHolder.fetch<{ result: { channel: WarpcastChannel } }>(url);
            const channel = result.channel;
            if (!channel) throw new Error('Channel not found');

            const formattedChannel = formatFarcasterChannelFromWarpcast(channel);
            if (session?.profileId && includeFollowingStatus) {
                const response = await runInSafeAsync(() =>
                    farcasterSessionHolder.fetch<{ result: { following: boolean } }>(
                        urlcat(WARPCAST_ROOT_URL_V1, '/user-channel', {
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
            const response = await fetchJson<ResponseJson<{ members: Profile[]; cursor?: string }>>(url, {
                method: 'GET',
            });
            const data = resolveResponseData(response);

            return createPageable(
                data.members,
                createIndicator(indicator),
                data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
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
            const response = await fetchJson<ResponseJson<{ followers: Profile[]; cursor?: string }>>(url, {
                method: 'GET',
            });
            const data = resolveResponseData(response);
            return createPageable(
                data.followers,
                createIndicator(indicator),
                data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
            );
        });
    }

    getChannelByHandle(channelHandle: string): Promise<Channel> {
        throw new NotImplementedError();
    }

    async getChannelFollowStatus(channelId: string, fid: string): Promise<boolean> {
        const response = await fetchJson<ResponseJson<{ following: boolean }>>(
            urlcat('/api/warpcast/channel/follow/status', {
                channelId,
                fid,
            }),
        );
        const data = resolveResponseData(response);
        return data.following;
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

    reportProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    reportPost(post: Post): Promise<boolean> {
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

    getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    get type() {
        return SessionType.Farcaster;
    }

    discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    discoverPostsById(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostById(postId: string): Promise<Post> {
        throw new NotImplementedError();
    }

    getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    getProfileById(profileId: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    getLikeReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getRepostReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    isFollowedByMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    isFollowingMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    getPostsLiked(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getPostsReplies(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getPostsBeMentioned(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    publishPost(post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    deletePost(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    upvotePost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    unvotePost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    commentPost(postId: string, post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    mirrorPost(postId: string): Promise<string> {
        throw new NotImplementedError();
    }

    unmirrorPost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    follow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unfollow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    searchPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getSuggestedFollows(indicator?: PageIndicator): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    getNotifications(indicator?: PageIndicator): Promise<Pageable<Notification, PageIndicator>> {
        throw new NotImplementedError();
    }

    getNotificationSettings(): Promise<NotificationSettings> {
        throw new NotImplementedError();
    }

    setNotificationSettings(settings: NotificationSettings): Promise<boolean> {
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

    updateProfile(profile: ProfileEditable): Promise<boolean> {
        throw new NotImplementedError();
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        const authToken = await getFarcasterAuthToken();
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
        const authToken = await getFarcasterAuthToken();
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
