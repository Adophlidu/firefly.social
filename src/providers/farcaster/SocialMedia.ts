import { NotImplementedError } from '@dimensiondev/utils';

import { type BookmarkType, FireflyPlatform, Source } from '@/constants/enum.js';
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
import { getFarcasterProfilesByIds } from '@/providers/farcaster/getFarcasterProfilesByIds.js';
import { getFarcasterSessionType } from '@/providers/farcaster/getFarcasterSessionType.js';
import { resolveFidFromAbnormalFarHandle } from '@/providers/farcaster/isAbnormalFarHandle.js';
import { registerFarcasterAccount } from '@/providers/farcaster/registerFarcasterAccount.js';
import { type FarcasterSession } from '@/providers/farcaster/Session.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { getFarcasterSuggestFollows } from '@/providers/firefly/endpoint/getFarcasterSuggestFollows.js';
import { getNotificationPushSwitch } from '@/providers/firefly/endpoint/getNotificationPushSwitch.js';
import { reportPost } from '@/providers/firefly/endpoint/reportPost.js';
import { setNotificationPushSwitch } from '@/providers/firefly/endpoint/setNotificationPushSwitch.js';
import { blockProfileFor } from '@/providers/firefly/farcaster-account/blockProfileFor.js';
import { unblockProfileFor } from '@/providers/firefly/farcaster-account/unblockProfileFor.js';
import { reportProfile } from '@/providers/firefly/report/reportProfile.js';
import { fireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { neynarSocialMediaProvider } from '@/providers/neynar/SocialMedia.js';
import { userDataAdd } from '@/providers/neynar/userDataAdd.js';
import { type Account } from '@/providers/types/Account.js';
import {
    NotificationPlatform,
    NotificationPushType,
    type NotificationSettings,
    NotificationTitle,
} from '@/providers/types/Firefly.js';
import { type Session } from '@/providers/types/Session.js';
import {
    type Channel,
    type Friendship,
    type Notification,
    type Post,
    type Profile,
    type ProfileBadge,
    type ProfileEditable,
    type ProfileForSignup,
    type Provider,
    SessionType,
} from '@/providers/types/SocialMedia.js';
import { getChannelFollowStatus } from '@/providers/warpcast/getChannelFollowStatus.js';
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
@AddAuthorHighlightStatusForPosts(Source.Farcaster)
class FarcasterSocialMedia implements Provider {
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
        return fireflySocialMediaProvider.getProfileByIdOrHandle(profileIdOrHandle);
    }

    getProfileByHandle(handle: string): Promise<Profile> {
        const fid = resolveFidFromAbnormalFarHandle(handle);
        if (fid) {
            return farcasterSocialMediaProvider.getProfileById(fid);
        }

        return fireflySocialMediaProvider.getProfileByHandle(handle);
    }

    getProfileBySession(session: Session): Promise<Profile> {
        const farcasterSession = session as FarcasterSession;
        return farcasterSocialMediaProvider.getProfileById(farcasterSession.profileId);
    }

    actPost(postId: string, options: unknown): Promise<void> {
        throw new NotImplementedError();
    }

    async getChannelById(channelId: string, includeFollowingStatus?: boolean): Promise<Channel> {
        const channel = await fireflySocialMediaProvider.getChannelByHandle(channelId);
        if (!includeFollowingStatus) return channel;

        const session = getSessionFromStorage(SessionType.Farcaster);
        if (!session?.profileId) return channel;

        const following = await runInSafeAsync(() => getChannelFollowStatus(channelId, session.profileId));
        channel.isMember = following ?? false;

        return channel;
    }

    getChannelsByIds(ids: string[]): Promise<Channel[]> {
        return neynarSocialMediaProvider.getChannelsByIds(ids);
    }

    getChannelByHandle(channelHandle: string, includeFollowingStatus?: boolean): Promise<Channel> {
        return farcasterSocialMediaProvider.getChannelById(channelHandle, includeFollowingStatus);
    }

    getChannelsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return fireflySocialMediaProvider.getChannelsByProfileId(profileId, indicator);
    }

    discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return fireflySocialMediaProvider.discoverChannels(indicator);
    }

    getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.getPostsByChannelHandle(channelId, indicator);
    }

    getPostsByChannelHandle(channelHandle: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.getPostsByChannelHandle(channelHandle, indicator);
    }

    searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return fireflySocialMediaProvider.searchChannels(q, indicator);
    }

    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.getChannelTrendingPosts(channel, indicator);
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return warpcastSocialMediaProvider.getChannelMembers(channelId, indicator);
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return warpcastSocialMediaProvider.getChannelFollowers(channelId, indicator);
    }

    get type() {
        return SessionType.Farcaster;
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.discoverPosts(indicator);
    }

    async discoverPostsById(profileId: string, indicator?: PageIndicator, signal?: AbortSignal) {
        return fireflySocialMediaProvider.discoverPostsById(profileId, indicator, signal);
    }

    async getCollectedPostsByProfileId(profileId: string, indicator?: PageIndicator) {
        return farcasterSocialMediaProvider.getPostsByProfileId(profileId, indicator);
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.getPostsByProfileId(profileId, indicator);
    }

    async getLikedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.getLikedPostsByProfileId(profileId, indicator);
    }

    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.getRepliesPostsByProfileId(profileId, indicator);
    }

    async getPostById(postId: string): Promise<Post> {
        return fireflySocialMediaProvider.getPostById(postId);
    }

    async getProfileById(profileId: string) {
        return farcasterSessionHolder.withSession((session) => getFarcasterProfileById(profileId, session?.profileId));
    }

    async getLikeReactors(postId: string, indicator?: PageIndicator) {
        return fireflySocialMediaProvider.getLikeReactors(postId, indicator);
    }

    async getRepostReactors(postId: string, indicator?: PageIndicator) {
        return fireflySocialMediaProvider.getRepostReactors(postId, indicator);
    }

    async getFollowers(profileId: string, indicator?: PageIndicator) {
        return fireflySocialMediaProvider.getFollowers(profileId, indicator);
    }

    async getFollowings(profileId: string, indicator?: PageIndicator) {
        return fireflySocialMediaProvider.getFollowings(profileId, indicator);
    }

    async getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return fireflySocialMediaProvider.getMutualFollowers(profileId, indicator);
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
        return fireflySocialMediaProvider.searchProfiles(q, indicator);
    }

    async searchPosts(
        q: string,
        indicator?: PageIndicator,
        fullMatch?: boolean,
    ): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.searchPosts(q, indicator, fullMatch);
    }

    async getSuggestedFollows(indicator?: PageIndicator): Promise<Pageable<Profile>> {
        return getFarcasterSuggestFollows(indicator);
    }

    async getNotifications(indicator?: PageIndicator): Promise<Pageable<Notification, PageIndicator>> {
        const { isGrantByPermission } = getFarcasterSessionType();
        if (isGrantByPermission) return fireflySocialMediaProvider.getNotifications(indicator);
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
        return fireflySocialMediaProvider.getThreadByPostId(postId, localPost);
    }

    getCommentsById(postId: string, indicator?: PageIndicator) {
        return fireflySocialMediaProvider.getCommentsById(postId, indicator);
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
        return fireflySocialMediaProvider.blockChannel(channelId);
    }

    async unblockChannel(channelId: string): Promise<boolean> {
        return fireflySocialMediaProvider.unblockChannel(channelId);
    }

    async getBlockedChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return fireflySocialMediaProvider.getBlockedChannels(indicator);
    }

    async getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.getPostsQuoteOn(postId, indicator);
    }
    async bookmark(
        postId: string,
        platform?: FireflyPlatform,
        profileId?: string,
        postType?: BookmarkType,
    ): Promise<boolean> {
        throw new NotImplementedError();
    }
    async unbookmark(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return fireflySocialMediaProvider.getBookmarks(indicator);
    }
    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        await Promise.all([
            typeof profile.displayName === 'string' ? userDataAdd(UserDataType.DISPLAY, profile.displayName) : null,
            typeof profile.bio === 'string' ? userDataAdd(UserDataType.BIO, profile.bio) : null,
            profile.pfp ? userDataAdd(UserDataType.PFP, profile.pfp) : null,
            typeof profile.website === 'string' ? userDataAdd(UserDataType.URL, profile.website) : null,
        ]);
        return true;
    }
    async getHiddenComments(postId: string, indicator?: PageIndicator) {
        return fireflySocialMediaProvider.getHiddenComments(postId, indicator);
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

export const farcasterSocialMediaProvider = new FarcasterSocialMedia();
