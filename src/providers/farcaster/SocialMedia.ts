import { BookmarkType, FireflyPlatform, Source, SourceInURL } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { UserDataType } from '@/constants/farcaster.js';
import { AddAuthorHighlightStatusForPosts } from '@/decorators/AddProfileHighlightStatus.js';
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
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getFarcasterProfileById } from '@/providers/farcaster/getFarcasterProfileById.js';
import { getFarcasterSessionType } from '@/providers/farcaster/getFarcasterSessionType.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { getFarcasterSuggestFollows } from '@/providers/firefly/endpoint/getFarcasterSuggestFollows.js';
import { reportProfile as reportProfileEndpoint } from '@/providers/firefly/endpoint/reportProfile.js';
import { farcasterAccountProvider } from '@/providers/firefly/FarcasterAccount.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { HubbleSocialMediaProvider } from '@/providers/hubble/SocialMedia.js';
import { NeynarSocialMediaProvider } from '@/providers/neynar/SocialMedia.js';
import {
    NotificationPlatform,
    NotificationPushType,
    type NotificationSettings,
    NotificationTitle,
} from '@/providers/types/Firefly.js';
import type { Session } from '@/providers/types/Session.js';
import {
    type Channel,
    type Friendship,
    type Notification,
    type Post,
    type Profile,
    type ProfileBadge,
    type ProfileEditable,
    type Provider,
    SessionType,
} from '@/providers/types/SocialMedia.js';
import { WarpcastSocialMediaProvider } from '@/providers/warpcast/SocialMedia.js';

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
@AddAuthorHighlightStatusForPosts(Source.Farcaster)
class FarcasterSocialMedia implements Provider {
    quotePost(postId: string, post: Post, profileId?: string): Promise<{ postId: string }> {
        return HubbleSocialMediaProvider.quotePost(postId, post, profileId);
    }

    commentPost(postId: string, post: Post): Promise<{ postId: string }> {
        return HubbleSocialMediaProvider.commentPost(postId, post);
    }

    collectPost(postId: string, collectionId?: string): Promise<void> {
        throw new NotImplementedError();
    }

    getFriendship(profileId: string): Promise<Friendship | null> {
        throw new NotImplementedError();
    }

    getProfilesByAddress(address: string): Promise<Profile[]> {
        throw new NotImplementedError();
    }

    getProfilesByIds(ids: string[], viewer?: string): Promise<Profile[]> {
        return FireflySocialMediaProvider.getProfilesByIds(ids, viewer);
    }

    getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        return FireflySocialMediaProvider.getProfileByIdOrHandle(profileIdOrHandle);
    }

    getProfileByHandle(handle: string): Promise<Profile> {
        return FireflySocialMediaProvider.getProfileByHandle(handle);
    }

    getProfileBySession(session: Session): Promise<Profile> {
        const farcasterSession = session as FarcasterSession;
        return FarcasterSocialMediaProvider.getProfileById(farcasterSession.profileId);
    }

    actPost(postId: string, options: unknown): Promise<void> {
        throw new NotImplementedError();
    }

    async getChannelById(channelId: string, includeFollowingStatus?: boolean): Promise<Channel> {
        const channel = await FireflySocialMediaProvider.getChannelByHandle(channelId);
        if (!includeFollowingStatus) return channel;

        const session = getSessionFromStorage(SessionType.Farcaster);
        if (!session?.profileId) return channel;

        const following = await runInSafeAsync(() =>
            WarpcastSocialMediaProvider.getChannelFollowStatus(channelId, session.profileId),
        );
        channel.isMember = following ?? false;

        return channel;
    }

    getChannelsByIds(ids: string[]): Promise<Channel[]> {
        return NeynarSocialMediaProvider.getChannelsByIds(ids);
    }

    getChannelByHandle(channelHandle: string, includeFollowingStatus?: boolean): Promise<Channel> {
        return FarcasterSocialMediaProvider.getChannelById(channelHandle, includeFollowingStatus);
    }

    getChannelsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return FireflySocialMediaProvider.getChannelsByProfileId(profileId);
    }

    discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return FireflySocialMediaProvider.discoverChannels(indicator);
    }

    getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.getPostsByChannelHandle(channelId, indicator);
    }

    getPostsByChannelHandle(channelHandle: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.getPostsByChannelHandle(channelHandle, indicator);
    }

    searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return FireflySocialMediaProvider.searchChannels(q, indicator);
    }

    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.getChannelTrendingPosts(channel, indicator);
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return WarpcastSocialMediaProvider.getChannelMembers(channelId, indicator);
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return WarpcastSocialMediaProvider.getChannelFollowers(channelId, indicator);
    }

    get type() {
        return SessionType.Farcaster;
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.discoverPosts(indicator);
    }

    async discoverPostsById(profileId: string, indicator?: PageIndicator, signal?: AbortSignal) {
        return FireflySocialMediaProvider.discoverPostsById(profileId, indicator, signal);
    }

    async getCollectedPostsByProfileId(profileId: string, indicator?: PageIndicator) {
        return FarcasterSocialMediaProvider.getPostsByProfileId(profileId, indicator);
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.getPostsByProfileId(profileId, indicator);
    }

    async getLikedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.getLikedPostsByProfileId(profileId, indicator);
    }

    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.getRepliesPostsByProfileId(profileId, indicator);
    }

    async getPostById(postId: string): Promise<Post> {
        return FireflySocialMediaProvider.getPostById(postId);
    }

    async getProfileById(profileId: string) {
        return farcasterSessionHolder.withSession((session) => getFarcasterProfileById(profileId, session?.profileId));
    }

    async getLikeReactors(postId: string, indicator?: PageIndicator) {
        return FireflySocialMediaProvider.getLikeReactors(postId, indicator);
    }

    async getRepostReactors(postId: string, indicator?: PageIndicator) {
        return FireflySocialMediaProvider.getRepostReactors(postId, indicator);
    }

    async getFollowers(profileId: string, indicator?: PageIndicator) {
        return FireflySocialMediaProvider.getFollowers(profileId, indicator);
    }

    async getFollowings(profileId: string, indicator?: PageIndicator) {
        return FireflySocialMediaProvider.getFollowings(profileId, indicator);
    }

    async getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return FireflySocialMediaProvider.getMutualFollowers(profileId, indicator);
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
        if (isGrantByPermission) return HubbleSocialMediaProvider.publishPost(post);
        throw new Error('No session found.');
    }

    async deletePost(postId: string): Promise<boolean> {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return HubbleSocialMediaProvider.deletePost(postId);
        throw new Error('No session found.');
    }

    async upvotePost(postId: string, authorId?: number) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return HubbleSocialMediaProvider.upvotePost(postId, authorId);
        throw new Error('No session found.');
    }

    async unvotePost(postId: string, authorId?: number) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return HubbleSocialMediaProvider.unvotePost(postId, authorId);
        throw new Error('No session found.');
    }

    async mirrorPost(postId: string, authorId?: number) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return HubbleSocialMediaProvider.mirrorPost(postId, authorId);
        throw new Error('No session found.');
    }

    async unmirrorPost(postId: string, authorId?: number) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return HubbleSocialMediaProvider.unmirrorPost(postId, authorId);
        throw new Error('No session found.');
    }

    async follow(profileId: string) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return HubbleSocialMediaProvider.follow(profileId);
        throw new Error('No session found.');
    }

    async unfollow(profileId: string) {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return HubbleSocialMediaProvider.unfollow(profileId);
        throw new Error('No session found.');
    }

    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return FireflySocialMediaProvider.searchProfiles(q, indicator);
    }

    async searchPosts(
        q: string,
        indicator?: PageIndicator,
        fullMatch?: boolean,
    ): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.searchPosts(q, indicator, fullMatch);
    }

    async getSuggestedFollows(indicator?: PageIndicator): Promise<Pageable<Profile>> {
        return getFarcasterSuggestFollows(indicator);
    }

    async getNotifications(indicator?: PageIndicator): Promise<Pageable<Notification, PageIndicator>> {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return FireflySocialMediaProvider.getNotifications(indicator);
        throw new Error('No session found.');
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        const settings = await FireflySocialMediaProvider.getNotificationPushSwitch();
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
        await FireflySocialMediaProvider.setNotificationPushSwitch({
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
        return FireflySocialMediaProvider.getThreadByPostId(postId, localPost);
    }

    getCommentsById(postId: string, indicator?: PageIndicator) {
        return FireflySocialMediaProvider.getCommentsById(postId, indicator);
    }

    async reportProfile(profileId: string) {
        return reportProfileEndpoint(profileId);
    }

    async reportPost(post: Post) {
        return FireflySocialMediaProvider.reportPost(post);
    }

    async blockProfile(profileId: string) {
        return farcasterAccountProvider.blockProfileFor(FireflyPlatform.Farcaster, profileId);
    }

    async unblockProfile(profileId: string) {
        return farcasterAccountProvider.unblockProfileFor(FireflyPlatform.Farcaster, profileId);
    }

    async getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return FireflySocialMediaProvider.getBlockedProfiles(indicator, SourceInURL.Farcaster);
    }

    async blockChannel(channelId: string): Promise<boolean> {
        return FireflySocialMediaProvider.blockChannel(channelId);
    }

    async unblockChannel(channelId: string): Promise<boolean> {
        return FireflySocialMediaProvider.unblockChannel(channelId);
    }

    async getBlockedChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return FireflySocialMediaProvider.getBlockedChannels(indicator);
    }

    async getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.getPostsQuoteOn(postId, indicator);
    }
    async bookmark(
        postId: string,
        platform?: FireflyPlatform,
        profileId?: string,
        postType?: BookmarkType,
    ): Promise<boolean> {
        return FireflySocialMediaProvider.bookmark(postId, platform, profileId, postType);
    }
    async unbookmark(postId: string): Promise<boolean> {
        return FireflySocialMediaProvider.unbookmark(postId);
    }
    async getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.getBookmarks(indicator);
    }
    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        await Promise.all([
            typeof profile.displayName === 'string'
                ? HubbleSocialMediaProvider.userDataAdd(UserDataType.DISPLAY, profile.displayName)
                : null,
            typeof profile.bio === 'string'
                ? HubbleSocialMediaProvider.userDataAdd(UserDataType.BIO, profile.bio)
                : null,
            profile.pfp ? HubbleSocialMediaProvider.userDataAdd(UserDataType.PFP, profile.pfp) : null,
            typeof profile.website === 'string'
                ? HubbleSocialMediaProvider.userDataAdd(UserDataType.URL, profile.website)
                : null,
        ]);
        return true;
    }
    async getHiddenComments(postId: string, indicator?: PageIndicator) {
        return FireflySocialMediaProvider.getHiddenComments(postId, indicator);
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
        return WarpcastSocialMediaProvider.joinChannel(channel);
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        return WarpcastSocialMediaProvider.leaveChannel(channel);
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

export const FarcasterSocialMediaProvider = new FarcasterSocialMedia();
