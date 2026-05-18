import type { FireflyPlatform } from '@dimensiondev/enums';
import { SessionType, Source } from '@dimensiondev/enums';
import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import { NotImplementedError } from '@dimensiondev/utils';
import type { NetworkType } from '@dimensiondev/web3/enums';

import type { BookmarkType } from '@/constants/enum.js';
import { AddBookmarkStatusForPosts } from '@/decorators/AddBookmarkStatusForPosts.js';
import { AddAuthorHighlightStatusForPosts } from '@/decorators/AddProfileHighlightStatus.js';
import { SetQueryDataForActPost } from '@/decorators/SetQueryDataForActPost.js';
import { SetQueryDataForBlockProfile } from '@/decorators/SetQueryDataForBlockProfile.js';
import { SetQueryDataForBookmarkPost } from '@/decorators/SetQueryDataForBookmarkPost.js';
import { SetQueryDataForCommentPost } from '@/decorators/SetQueryDataForCommentPost.js';
import { SetQueryDataForDeletePost } from '@/decorators/SetQueryDataForDeletePost.js';
import { SetQueryDataForFollowProfile } from '@/decorators/SetQueryDataForFollowProfile.js';
import { SetQueryDataForJoinChannel } from '@/decorators/SetQueryDataForJoinChannel.js';
import { SetQueryDataForLikePost } from '@/decorators/SetQueryDataForLikePost.js';
import { SetQueryDataForMirrorPost } from '@/decorators/SetQueryDataForMirrorPost.js';
import { SetQueryDataForPosts } from '@/decorators/SetQueryDataForPosts.js';
import { WithMutedProfilesQuery } from '@/decorators/WithMutedProfilesQuery.js';
import { blockBskyProfile } from '@/providers/bsky/blockBskyProfile.js';
import { deleteBskyPost } from '@/providers/bsky/deleteBskyPost.js';
import { discoverBskyChannels } from '@/providers/bsky/discoverBskyChannels.js';
import { discoverBskyPosts } from '@/providers/bsky/discoverBskyPosts.js';
import { discoverBskyPostsById } from '@/providers/bsky/discoverBskyPostsById.js';
import { followBskyProfile } from '@/providers/bsky/followBskyProfile.js';
import { getBskyBlockedProfiles } from '@/providers/bsky/getBskyBlockedProfiles.js';
import { getBskyBookmarks } from '@/providers/bsky/getBskyBookmarks.js';
import { getBskyChannelById } from '@/providers/bsky/getBskyChannelById.js';
import { getBskyChannelsByIds } from '@/providers/bsky/getBskyChannelsByIds.js';
import { getBskyCommentsById } from '@/providers/bsky/getBskyCommentsById.js';
import { getBskyFollowers } from '@/providers/bsky/getBskyFollowers.js';
import { getBskyFollowings } from '@/providers/bsky/getBskyFollowings.js';
import { getBskyHiddenComments } from '@/providers/bsky/getBskyHiddenComments.js';
import { getBskyLikedPostsByProfileId } from '@/providers/bsky/getBskyLikedPostsByProfileId.js';
import { getBskyLikeReactors } from '@/providers/bsky/getBskyLikeReactors.js';
import { getBskyMediaPostsByProfileId } from '@/providers/bsky/getBskyMediaPostsByProfileId.js';
import { getBskyMutualFollowers } from '@/providers/bsky/getBskyMutualFollowers.js';
import { getBskyNotifications } from '@/providers/bsky/getBskyNotifications.js';
import { getBskyNotificationSettings } from '@/providers/bsky/getBskyNotificationSettings.js';
import { getBskyPinnedPost } from '@/providers/bsky/getBskyPinnedPost.js';
import { getBskyPostById } from '@/providers/bsky/getBskyPostById.js';
import { getBskyPostsByChannelId } from '@/providers/bsky/getBskyPostsByChannelId.js';
import { getBskyPostsByProfileId } from '@/providers/bsky/getBskyPostsByProfileId.js';
import { getBskyPostsQuoteOn } from '@/providers/bsky/getBskyPostsQuoteOn.js';
import { getBskyProfileByHandle } from '@/providers/bsky/getBskyProfileByHandle.js';
import { getBskyProfileById } from '@/providers/bsky/getBskyProfileById.js';
import { getBskyProfileBySession } from '@/providers/bsky/getBskyProfileBySession.js';
import { getBskyProfilesByIds } from '@/providers/bsky/getBskyProfilesByIds.js';
import { getBskyRepliesPostsByProfileId } from '@/providers/bsky/getBskyRepliesPostsByProfileId.js';
import { getBskyRepostReactors } from '@/providers/bsky/getBskyRepostReactors.js';
import { getBskySuggestedFollows } from '@/providers/bsky/getBskySuggestedFollows.js';
import { getBskyThreadByPostId } from '@/providers/bsky/getBskyThreadByPostId.js';
import { isBskyFollowedByMe } from '@/providers/bsky/isBskyFollowedByMe.js';
import { isBskyFollowingMe } from '@/providers/bsky/isBskyFollowingMe.js';
import { joinBskyChannel } from '@/providers/bsky/joinBskyChannel.js';
import { leaveBskyChannel } from '@/providers/bsky/leaveBskyChannel.js';
import { mirrorBskyPost } from '@/providers/bsky/mirrorBskyPost.js';
import { publishBskyPost } from '@/providers/bsky/publishBskyPost.js';
import { quoteBskyPost } from '@/providers/bsky/quoteBskyPost.js';
import { searchBskyChannels } from '@/providers/bsky/searchBskyChannels.js';
import { searchBskyPosts } from '@/providers/bsky/searchBskyPosts.js';
import { searchBskyProfiles } from '@/providers/bsky/searchBskyProfiles.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { setBskyNotificationSettings } from '@/providers/bsky/setBskyNotificationSettings.js';
import { unblockBskyProfile } from '@/providers/bsky/unblockBskyProfile.js';
import { unfollowBskyProfile } from '@/providers/bsky/unfollowBskyProfile.js';
import { unmirrorBskyPost } from '@/providers/bsky/unmirrorBskyPost.js';
import { unvoteBskyPost } from '@/providers/bsky/unvoteBskyPost.js';
import { updateBskyProfile } from '@/providers/bsky/updateBskyProfile.js';
import { upvoteBskyPost } from '@/providers/bsky/upvoteBskyPost.js';
import { bookmark } from '@/providers/firefly/endpoint/bookmark.js';
import { unbookmark } from '@/providers/firefly/endpoint/unbookmark.js';
import type { Account } from '@/providers/types/Account.js';
import type { NotificationSettings, WalletProfile } from '@/providers/types/Firefly.js';
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

@SetQueryDataForLikePost(Source.Bsky)
@SetQueryDataForBookmarkPost(Source.Bsky)
@SetQueryDataForMirrorPost(Source.Bsky)
@SetQueryDataForCommentPost(Source.Bsky)
@SetQueryDataForDeletePost(Source.Bsky)
@SetQueryDataForBlockProfile(Source.Bsky)
@SetQueryDataForFollowProfile(Source.Bsky)
@SetQueryDataForActPost(Source.Bsky)
@SetQueryDataForPosts
@SetQueryDataForJoinChannel(Source.Bsky)
@AddBookmarkStatusForPosts(Source.Bsky)
@AddAuthorHighlightStatusForPosts(Source.Bsky)
@WithMutedProfilesQuery()
class BskySocialMedia implements Provider {
    get type() {
        return SessionType.Bsky;
    }

    async publishPost(post: Post, signal?: AbortSignal) {
        return publishBskyPost(post, signal);
    }

    async deletePost(postId: string): Promise<boolean> {
        return deleteBskyPost(postId);
    }
    async mirrorPost(postId: string, authorId?: number): Promise<string> {
        return mirrorBskyPost(postId, authorId);
    }
    async unmirrorPost(postId: string, authorId?: number): Promise<void> {
        await unmirrorBskyPost(postId, authorId);
    }
    async quotePost(
        postId: string,
        post: Post,
        authorId?: number,
        signal?: AbortSignal,
    ): Promise<{ postId: string; contentURI?: string }> {
        return quoteBskyPost(postId, post, signal);
    }
    async commentPost(
        postId: string,
        post: Post,
        signal?: AbortSignal,
    ): Promise<{ postId: string; contentURI?: string }> {
        return publishBskyPost(post, signal);
    }
    async collectPost(postId: string, collectionId?: string): Promise<void> {
        throw new NotImplementedError();
    }
    async getCollectedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async actPost(postId: string, options: unknown): Promise<void> {
        throw new NotImplementedError();
    }
    async upvotePost(postId: string): Promise<void> {
        await upvoteBskyPost(postId);
    }
    async unvotePost(postId: string): Promise<void> {
        await unvoteBskyPost(postId);
    }
    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        return getBskyProfilesByIds(ids);
    }
    async getChannelsByIds(ids: string[]): Promise<Channel[]> {
        return getBskyChannelsByIds(ids);
    }
    async getProfileById(profileId: string): Promise<Profile> {
        return getBskyProfileById(profileId);
    }
    async getProfileByHandle(handle: string): Promise<Profile> {
        return getBskyProfileByHandle(handle);
    }
    async getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        return getBskyProfileById(profileIdOrHandle);
    }
    async getProfileBySession(session: Session): Promise<Profile> {
        return getBskyProfileBySession(session as BskySession);
    }
    async getPostById(postId: string): Promise<Post> {
        return getBskyPostById(postId);
    }
    async getChannelById(channelId: string, includeFollowingStatus?: boolean): Promise<Channel> {
        return getBskyChannelById(channelId, includeFollowingStatus);
    }
    async getChannelByHandle(channelHandle: string): Promise<Channel> {
        throw new NotImplementedError();
    }
    async getChannelsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getCommentsById(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getBskyCommentsById(postId, indicator);
    }
    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return discoverBskyPosts(indicator);
    }
    async discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return discoverBskyChannels(indicator);
    }
    async discoverPostsById(
        profileId: string,
        indicator?: PageIndicator,
        signal?: AbortSignal,
    ): Promise<Pageable<Post, PageIndicator>> {
        return discoverBskyPostsById(profileId, indicator, signal);
    }
    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getBskyPostsByProfileId(profileId, indicator);
    }
    async getLikedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return getBskyLikedPostsByProfileId(profileId, indicator);
    }
    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return getBskyRepliesPostsByProfileId(profileId, indicator);
    }
    async getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getBskyPostsByChannelId(channelId, indicator);
    }
    async getPostsByChannelHandle(
        channelHandle: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getPostsBeMentioned(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getPostsLiked(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getPostsReplies(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getFriendship(profileId: string): Promise<Friendship | null> {
        throw new NotImplementedError();
    }
    async follow(profileId: string): Promise<boolean> {
        return followBskyProfile(profileId);
    }
    async unfollow(profileId: string): Promise<boolean> {
        return unfollowBskyProfile(profileId);
    }

    async getFollowers(
        profileId: string,
        indicator?: PageIndicator,
        signal?: AbortSignal,
    ): Promise<Pageable<Profile, PageIndicator>> {
        return getBskyFollowers(profileId, indicator, signal);
    }

    async getFollowings(
        profileId: string,
        indicator?: PageIndicator,
        signal?: AbortSignal,
    ): Promise<Pageable<Profile, PageIndicator>> {
        return getBskyFollowings(profileId, indicator, signal);
    }

    async getMutualFollowers(
        profileId: string,
        indicator?: PageIndicator,
        signal?: AbortSignal,
    ): Promise<Pageable<Profile, PageIndicator>> {
        return getBskyMutualFollowers(profileId, indicator, signal);
    }
    async isFollowedByMe(profileId: string): Promise<boolean> {
        return isBskyFollowedByMe(profileId);
    }
    async isFollowingMe(profileId: string): Promise<boolean> {
        return isBskyFollowingMe(profileId);
    }
    async getNotifications(
        _highSignalFilter?: boolean,
        indicator?: PageIndicator,
    ): Promise<Pageable<Notification, PageIndicator>> {
        return getBskyNotifications(indicator);
    }
    async getNotificationSettings(): Promise<NotificationSettings> {
        return getBskyNotificationSettings();
    }
    async setNotificationSettings(settings: NotificationSettings): Promise<boolean> {
        return setBskyNotificationSettings(settings);
    }
    async getSuggestedFollows(includeFollowingStatus?: boolean, locale?: unknown, indicator?: PageIndicator) {
        return getBskySuggestedFollows(includeFollowingStatus, locale, indicator);
    }
    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return searchBskyProfiles(q, indicator);
    }
    async searchPosts(
        q: string,
        _fullMatch?: boolean,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return searchBskyPosts(q, indicator);
    }
    async searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return searchBskyChannels(q, indicator);
    }
    async getThreadByPostId(postId: string, localPost?: Post): Promise<Post[]> {
        return getBskyThreadByPostId(postId, localPost);
    }
    async getLikeReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return getBskyLikeReactors(postId, indicator);
    }
    async getRepostReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return getBskyRepostReactors(postId, indicator);
    }
    async getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getBskyPostsQuoteOn(postId, indicator);
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
        return getBskyBookmarks(indicator);
    }
    async blockWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }
    async unblockWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }
    async getBlockedWallets(indicator?: PageIndicator): Promise<Pageable<WalletProfile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async watchWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }
    async unwatchWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }
    async blockProfile(profileId: string): Promise<boolean> {
        return blockBskyProfile(profileId);
    }
    async unblockProfile(profileId: string): Promise<boolean> {
        return unblockBskyProfile(profileId);
    }
    async getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return getBskyBlockedProfiles(indicator);
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
    async reportProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async reportPost(post: Post): Promise<boolean> {
        throw new NotImplementedError();
    }
    async reportChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        return updateBskyProfile(profile);
    }
    async getHiddenComments(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getBskyHiddenComments(postId, indicator);
    }
    async getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        throw new NotImplementedError();
    }
    async joinChannel(channel: Channel): Promise<boolean> {
        return joinBskyChannel(channel);
    }
    async leaveChannel(channel: Channel): Promise<boolean> {
        return leaveBskyChannel(channel);
    }
    async getPinnedPost(profileId: string): Promise<Post | null> {
        return getBskyPinnedPost(profileId);
    }
    async decryptPost(post: Post): Promise<Post | null> {
        throw new NotImplementedError();
    }
    async getMediaPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return getBskyMediaPostsByProfileId(profileId, indicator);
    }

    async createAccount(profile: ProfileForSignup): Promise<Account> {
        throw new NotImplementedError();
    }
}

export { BskySocialMedia };
export const bskySocialMediaProvider = new BskySocialMedia();
