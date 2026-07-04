import type { BookmarkType } from '@dimensiondev/enums';
import { FireflyPlatform, SessionType, Source } from '@dimensiondev/enums';
import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import { NotImplementedError } from '@dimensiondev/utils';

import { AddAuthorFifaCampStatusForPosts } from '@/decorators/AddFifaCampStatusForPosts.js';
import { SetQueryDataForActPost } from '@/decorators/SetQueryDataForActPost.js';
import { SetQueryDataForBlockChannel } from '@/decorators/SetQueryDataForBlockChannel.js';
import { SetQueryDataForBlockProfile } from '@/decorators/SetQueryDataForBlockProfile.js';
import { SetQueryDataForBookmarkPost } from '@/decorators/SetQueryDataForBookmarkPost.js';
import { SetQueryDataForCommentPost } from '@/decorators/SetQueryDataForCommentPost.js';
import { SetQueryDataForDeletePost } from '@/decorators/SetQueryDataForDeletePost.js';
import { SetQueryDataForFollowProfile } from '@/decorators/SetQueryDataForFollowProfile.js';
import { SetQueryDataForJoinChannel } from '@/decorators/SetQueryDataForJoinChannel.js';
import { SetQueryDataForLikePost } from '@/decorators/SetQueryDataForLikePost.js';
import { SetQueryDataForMirrorPost } from '@/decorators/SetQueryDataForMirrorPost.js';
import { SetQueryDataForPosts } from '@/decorators/SetQueryDataForPosts.js';
import { SetQueryDataForReportPost } from '@/decorators/SetQueryDataForReportPost.js';
import { WithMutedProfilesQuery } from '@/decorators/WithMutedProfilesQuery.js';
import { getFarcasterProfilesByIds } from '@/providers/farcaster/getFarcasterProfilesByIds.js';
import { getFarcasterSessionType } from '@/providers/farcaster/getFarcasterSessionType.js';
import { resolveFidFromAbnormalFarHandle } from '@/providers/farcaster/isAbnormalFarHandle.js';
import { registerFarcasterAccount } from '@/providers/farcaster/registerFarcasterAccount.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { bookmark } from '@/providers/firefly/endpoint/bookmark.js';
import { discoverPosts } from '@/providers/firefly/endpoint/discoverPosts.js';
import { discoverPostsById } from '@/providers/firefly/endpoint/discoverPostsById.js';
import { getBookmarks } from '@/providers/firefly/endpoint/getBookmarks.js';
import { getLikedPostsByProfileId } from '@/providers/firefly/endpoint/getLikedPostsByProfileId.js';
import { getNotificationPushSwitch } from '@/providers/firefly/endpoint/getNotificationPushSwitch.js';
import { getPostsByProfileId } from '@/providers/firefly/endpoint/getPostsByProfileId.js';
import { getRepliesPostsByProfileId } from '@/providers/firefly/endpoint/getRepliesPostsByProfileId.js';
import { reportPost } from '@/providers/firefly/endpoint/reportPost.js';
import { searchChannels } from '@/providers/firefly/endpoint/searchChannels.js';
import { searchProfiles } from '@/providers/firefly/endpoint/searchProfiles.js';
import { setNotificationPushSwitch } from '@/providers/firefly/endpoint/setNotificationPushSwitch.js';
import { unbookmark } from '@/providers/firefly/endpoint/unbookmark.js';
import { blockProfileFor } from '@/providers/firefly/farcaster-account/blockProfileFor.js';
import { unblockProfileFor } from '@/providers/firefly/farcaster-account/unblockProfileFor.js';
import { blockChannel } from '@/providers/firefly/farcaster-hub/blockChannel.js';
import { discoverChannels } from '@/providers/firefly/farcaster-hub/discoverChannels.js';
import { getBlockedChannels } from '@/providers/firefly/farcaster-hub/getBlockedChannels.js';
import { getChannelById } from '@/providers/firefly/farcaster-hub/getChannelById.js';
import { getChannelsByProfileId } from '@/providers/firefly/farcaster-hub/getChannelsByProfileId.js';
import { getChannelTrendingPosts } from '@/providers/firefly/farcaster-hub/getChannelTrendingPosts.js';
import { getCommentsById } from '@/providers/firefly/farcaster-hub/getCommentsById.js';
import { getFarcasterSuggestFollows } from '@/providers/firefly/farcaster-hub/getFarcasterSuggestFollows.js';
import { getFollowers } from '@/providers/firefly/farcaster-hub/getFollowers.js';
import { getFollowings } from '@/providers/firefly/farcaster-hub/getFollowings.js';
import { getHiddenComments } from '@/providers/firefly/farcaster-hub/getHiddenComments.js';
import { getLikeReactors } from '@/providers/firefly/farcaster-hub/getLikeReactors.js';
import { getMutualFollowers } from '@/providers/firefly/farcaster-hub/getMutualFollowers.js';
import { getNotifications } from '@/providers/firefly/farcaster-hub/getNotifications.js';
import { getPostById } from '@/providers/firefly/farcaster-hub/getPostById.js';
import { getPostsByChannelHandle } from '@/providers/firefly/farcaster-hub/getPostsByChannelHandle.js';
import { getPostsQuoteOn } from '@/providers/firefly/farcaster-hub/getPostsQuoteOn.js';
import { getProfileByHandle } from '@/providers/firefly/farcaster-hub/getProfileByHandle.js';
import { getProfileById } from '@/providers/firefly/farcaster-hub/getProfileById.js';
import { getProfileByIdOrHandle } from '@/providers/firefly/farcaster-hub/getProfileByIdOrHandle.js';
import { getRepostReactors } from '@/providers/firefly/farcaster-hub/getRepostReactors.js';
import { getThreadByPostId } from '@/providers/firefly/farcaster-hub/getThreadByPostId.js';
import { searchPosts } from '@/providers/firefly/farcaster-hub/searchPosts.js';
import { unblockChannel } from '@/providers/firefly/farcaster-hub/unblockChannel.js';
import { reportProfile } from '@/providers/firefly/report/reportProfile.js';
import { neynarSocialMediaProvider } from '@/providers/neynar/SocialMedia.js';
import { updateProfile } from '@/providers/neynar/updateProfile.js';
import type { Account } from '@/providers/types/Account.js';
import {
    NotificationPlatform,
    NotificationPushType,
    type NotificationSettings,
    NotificationTitle,
} from '@/providers/types/Firefly.js';
import type { Session } from '@/providers/types/Session.js';
import type {
    Channel,
    Friendship,
    Notification,
    Post,
    Profile,
    ProfileBadge,
    ProfileEditable,
    ProfileForSignup,
    Provider,
} from '@/providers/types/SocialMedia.js';
import { warpcastSocialMediaProvider } from '@/providers/warpcast/SocialMedia.js';

@WithMutedProfilesQuery()
@SetQueryDataForLikePost(Source.Farcaster)
@SetQueryDataForBookmarkPost(Source.Farcaster)
@SetQueryDataForBookmarkPost(Source.Article)
@SetQueryDataForBookmarkPost(Source.DAOs)
@SetQueryDataForMirrorPost(Source.Farcaster)
@SetQueryDataForCommentPost(Source.Farcaster)
@SetQueryDataForDeletePost(Source.Farcaster)
@SetQueryDataForBlockProfile(Source.Farcaster)
@SetQueryDataForFollowProfile(Source.Farcaster)
@SetQueryDataForBlockChannel(Source.Farcaster)
@SetQueryDataForActPost(Source.Farcaster)
@SetQueryDataForJoinChannel(Source.Farcaster)
@SetQueryDataForReportPost(Source.Farcaster)
@SetQueryDataForPosts
@AddAuthorFifaCampStatusForPosts(Source.Farcaster)
class FarcasterSocialMedia implements Provider {
    get type() {
        return SessionType.Farcaster;
    }

    quotePost(postId: string, post: Post, authorId?: number): Promise<{ postId: string }> {
        return neynarSocialMediaProvider.quotePost(postId, post, authorId);
    }

    commentPost(postId: string, post: Post): Promise<{ postId: string }> {
        return neynarSocialMediaProvider.commentPost(postId, post);
    }

    collectPost(postId: string, collectionId?: string): Promise<void> {
        throw new NotImplementedError();
    }

    getFriendship(profileId: string): Promise<Friendship | null> {
        throw new NotImplementedError();
    }

    getProfilesByIds(ids: string[]): Promise<Profile[]> {
        return getFarcasterProfilesByIds(ids);
    }

    getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        return getProfileByIdOrHandle(profileIdOrHandle);
    }

    getProfileByHandle(handle: string): Promise<Profile> {
        const fid = resolveFidFromAbnormalFarHandle(handle);
        if (fid) return getProfileById(fid);
        return getProfileByHandle(handle);
    }

    getProfileBySession(session: Session): Promise<Profile> {
        const farcasterSession = session as FarcasterSession;
        return getProfileById(farcasterSession.profileId);
    }

    actPost(postId: string, options: unknown): Promise<void> {
        throw new NotImplementedError();
    }

    async getChannelById(channelId: string, includeFollowingStatus?: boolean): Promise<Channel> {
        return getChannelById(channelId, includeFollowingStatus);
    }

    getChannelsByIds(ids: string[]): Promise<Channel[]> {
        return neynarSocialMediaProvider.getChannelsByIds(ids);
    }

    getChannelByHandle(channelHandle: string, includeFollowingStatus?: boolean): Promise<Channel> {
        return getChannelById(channelHandle, includeFollowingStatus);
    }

    getChannelsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return getChannelsByProfileId(profileId, indicator);
    }

    discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return discoverChannels(indicator);
    }

    getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getPostsByChannelHandle(channelId, indicator);
    }

    getPostsByChannelHandle(channelHandle: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getPostsByChannelHandle(channelHandle, indicator);
    }

    searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return searchChannels(q, indicator);
    }

    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getChannelTrendingPosts(channel, indicator);
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return warpcastSocialMediaProvider.getChannelMembers(channelId, indicator);
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return warpcastSocialMediaProvider.getChannelFollowers(channelId, indicator);
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return discoverPosts(indicator);
    }

    async discoverPostsById(profileId: string, indicator?: PageIndicator, signal?: AbortSignal) {
        return discoverPostsById(profileId, indicator, signal);
    }

    async getCollectedPostsByProfileId(profileId: string, indicator?: PageIndicator) {
        return getPostsByProfileId(profileId, indicator);
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getPostsByProfileId(profileId, indicator);
    }

    async getLikedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return getLikedPostsByProfileId(profileId, indicator);
    }

    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return getRepliesPostsByProfileId(profileId, indicator);
    }

    async getPostById(postId: string): Promise<Post> {
        return getPostById(postId);
    }

    async getProfileById(profileId: string) {
        return getProfileById(profileId);
    }

    async getLikeReactors(postId: string, indicator?: PageIndicator) {
        return getLikeReactors(postId, indicator);
    }

    async getRepostReactors(postId: string, indicator?: PageIndicator) {
        return getRepostReactors(postId, indicator);
    }

    async getFollowers(profileId: string, indicator?: PageIndicator) {
        return getFollowers(profileId, indicator);
    }

    async getFollowings(profileId: string, indicator?: PageIndicator) {
        return getFollowings(profileId, indicator);
    }

    async getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return getMutualFollowers(profileId, indicator);
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
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return neynarSocialMediaProvider.publishPost(post);
        throw new Error('No session found.');
    }

    async deletePost(postId: string): Promise<boolean> {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return neynarSocialMediaProvider.deletePost(postId);
        throw new Error('No session found.');
    }

    async upvotePost(postId: string, authorId?: number) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return neynarSocialMediaProvider.upvotePost(postId, authorId);
        throw new Error('No session found.');
    }

    async unvotePost(postId: string, authorId?: number) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return neynarSocialMediaProvider.unvotePost(postId, authorId);
        throw new Error('No session found.');
    }

    async mirrorPost(postId: string, authorId?: number) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return neynarSocialMediaProvider.mirrorPost(postId, authorId);
        throw new Error('No session found.');
    }

    async unmirrorPost(postId: string, authorId?: number) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return neynarSocialMediaProvider.unmirrorPost(postId, authorId);
        throw new Error('No session found.');
    }

    async follow(profileId: string) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return neynarSocialMediaProvider.follow(profileId);
        throw new Error('No session found.');
    }

    async unfollow(profileId: string) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return neynarSocialMediaProvider.unfollow(profileId);
        throw new Error('No session found.');
    }

    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return searchProfiles(q, indicator);
    }

    async searchPosts(
        q: string,
        fullMatch?: boolean,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return searchPosts(q, fullMatch, indicator);
    }

    async getSuggestedFollows(
        _includeFollowingStatus?: boolean,
        _locale?: unknown,
        indicator?: PageIndicator,
    ): Promise<Pageable<Profile>> {
        return getFarcasterSuggestFollows(indicator);
    }

    async getNotifications(
        _highSignalFilter?: boolean,
        indicator?: PageIndicator,
    ): Promise<Pageable<Notification, PageIndicator>> {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return getNotifications(indicator);
        throw new Error('No session found.');
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        const settings = await getNotificationPushSwitch();
        const current = settings.list.find((x) => x.title === NotificationTitle.NotificationsMode);

        return {
            priority:
                current?.list.find(
                    (x) =>
                        x.platform === NotificationPlatform.Priority && x.push_type === NotificationPushType.Priority,
                )?.state ?? false,
        };
    }

    async setNotificationSettings(settings: NotificationSettings) {
        await setNotificationPushSwitch({
            list: [
                {
                    platform: NotificationPlatform.Priority,
                    push_type: NotificationPushType.Priority,
                    state: settings.priority,
                },
            ],
        });
        return true;
    }

    async getThreadByPostId(postId: string, localPost?: Post) {
        return getThreadByPostId(postId, localPost);
    }

    getCommentsById(postId: string, indicator?: PageIndicator) {
        return getCommentsById(postId, indicator);
    }

    async reportProfile(profileId: string) {
        return reportProfile(profileId);
    }

    async reportPost(post: Post) {
        return reportPost(post);
    }

    async blockProfile(profileId: string) {
        return blockProfileFor(FireflyPlatform.Farcaster, profileId);
    }

    async unblockProfile(profileId: string) {
        return unblockProfileFor(FireflyPlatform.Farcaster, profileId);
    }

    async getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async blockChannel(channelId: string): Promise<boolean> {
        return blockChannel(channelId);
    }

    async unblockChannel(channelId: string): Promise<boolean> {
        return unblockChannel(channelId);
    }

    async getBlockedChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return getBlockedChannels(indicator);
    }

    async getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getPostsQuoteOn(postId, indicator);
    }
    async bookmark(
        postId: string,
        platform?: FireflyPlatform,
        profileId?: string,
        postType?: BookmarkType,
    ): Promise<boolean> {
        return bookmark(postId, platform, profileId, postType);
    }
    async unbookmark(postId: string): Promise<boolean> {
        return unbookmark(postId);
    }
    async getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getBookmarks(indicator);
    }
    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        return updateProfile(profile);
    }
    async getHiddenComments(postId: string, indicator?: PageIndicator) {
        return getHiddenComments(postId, indicator);
    }

    async getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        return profile.isProUser
            ? [
                  {
                      source: Source.Farcaster,
                  },
              ]
            : [];
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        return warpcastSocialMediaProvider.joinChannel(channel);
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        return warpcastSocialMediaProvider.leaveChannel(channel);
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
        return registerFarcasterAccount(profile);
    }
}

export { FarcasterSocialMedia };
export const farcasterSocialMediaProvider = new FarcasterSocialMedia();
