import { NotImplementedError } from '@dimensiondev/utils';

import { Source } from '@/constants/enum.js';
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
import { SetQueryDataForReportPost } from '@/decorators/SetQueryDataForReportPost.js';
import { WithMutedProfilesQuery } from '@/decorators/WithMutedProfilesQuery.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { actLensPost } from '@/providers/lens/actLensPost.js';
import { blockLensProfile } from '@/providers/lens/blockLensProfile.js';
import { bookmarkLensPost } from '@/providers/lens/bookmarkLensPost.js';
import { collectLensPost } from '@/providers/lens/collectLensPost.js';
import { commentLensPost } from '@/providers/lens/commentLensPost.js';
import { createLensAccount } from '@/providers/lens/createLensAccount.js';
import { deleteLensPost } from '@/providers/lens/deleteLensPost.js';
import { discoverLensChannels } from '@/providers/lens/discoverLensChannels.js';
import { discoverLensPosts } from '@/providers/lens/discoverLensPosts.js';
import { discoverLensPostsById } from '@/providers/lens/discoverLensPostsById.js';
import { followLensProfile } from '@/providers/lens/followLensProfile.js';
import { getCommentsByPostId } from '@/providers/lens/getCommentsByPostId.js';
import { getLensBookmarks } from '@/providers/lens/getLensBookmarks.js';
import { getLensChannelById } from '@/providers/lens/getLensChannelById.js';
import { getLensChannelMembers } from '@/providers/lens/getLensChannelMembers.js';
import { getLensChannelsByProfileId } from '@/providers/lens/getLensChannelsByProfileId.js';
import { getLensCollectedPostsByProfileId } from '@/providers/lens/getLensCollectedPostsByProfileId.js';
import { getLensFollowers } from '@/providers/lens/getLensFollowers.js';
import { getLensFollowings } from '@/providers/lens/getLensFollowings.js';
import { getLensHiddenComments } from '@/providers/lens/getLensHiddenComments.js';
import { getLensLikeReactors } from '@/providers/lens/getLensLikeReactors.js';
import { getLensMediaPostsByProfileId } from '@/providers/lens/getLensMediaPostsByProfileId.js';
import { getLensMutualFollowers } from '@/providers/lens/getLensMutualFollowers.js';
import { getLensNotifications } from '@/providers/lens/getLensNotifications.js';
import { getLensNotificationSettings } from '@/providers/lens/getLensNotificationSettings.js';
import { getLensPostById } from '@/providers/lens/getLensPostById.js';
import { getLensPostsBeMentioned } from '@/providers/lens/getLensPostsBeMentioned.js';
import { getLensPostsByChannelId } from '@/providers/lens/getLensPostsByChannelId.js';
import { getLensPostsByProfileId } from '@/providers/lens/getLensPostsByProfileId.js';
import { getLensPostsQuoteOn } from '@/providers/lens/getLensPostsQuoteOn.js';
import { getLensPostsReplies } from '@/providers/lens/getLensPostsReplies.js';
import { getLensProfileByHandle } from '@/providers/lens/getLensProfileByHandle.js';
import { getLensProfileById } from '@/providers/lens/getLensProfileById.js';
import { getLensProfileBySession } from '@/providers/lens/getLensProfileBySession.js';
import { getLensProfilesByIds } from '@/providers/lens/getLensProfilesById.js';
import { getLensRepliesPostsByProfileId } from '@/providers/lens/getLensRepliesPostsByProfileId.js';
import { getLensRepostReactors } from '@/providers/lens/getLensRepostReactors.js';
import { getLensSuggestedFollows } from '@/providers/lens/getLensSuggestedFollows.js';
import { getLensThreadByPostId } from '@/providers/lens/getLensThreadByPostId.js';
import { isLensFollowedByMe } from '@/providers/lens/isLensFollowedByMe.js';
import { isLensFollowingMe } from '@/providers/lens/isLensFollowingMe.js';
import { joinLensChannel } from '@/providers/lens/joinLensChannel.js';
import { leaveLensChannel } from '@/providers/lens/leaveLensChannel.js';
import { mirrorLensPost } from '@/providers/lens/mirrorLensPost.js';
import { publishLensPost } from '@/providers/lens/publishLensPost.js';
import { quoteLensPost } from '@/providers/lens/quoteLensPost.js';
import { reportLensPost } from '@/providers/lens/reportLensPost.js';
import { reportLensProfile } from '@/providers/lens/reportLensProfile.js';
import { searchLensChannels } from '@/providers/lens/searchLensChannels.js';
import { searchLensPosts } from '@/providers/lens/searchLensPosts.js';
import { searchLensProfiles } from '@/providers/lens/searchLensProfiles.js';
import { type LensSession } from '@/providers/lens/Session.js';
import { setLensNotificationSettings } from '@/providers/lens/setLensNotificationSettings.js';
import { unblockLensProfile } from '@/providers/lens/unblockLensProfile.js';
import { unbookmarkLensPost } from '@/providers/lens/unbookmarkLensPost.js';
import { unfollowLensProfile } from '@/providers/lens/unfollowLensProfile.js';
import { unmirrorLensPost } from '@/providers/lens/unmirrorLensPost.js';
import { unvoteLensPost } from '@/providers/lens/unvoteLensPost.js';
import { updateLensProfile } from '@/providers/lens/updateLensProfile.js';
import { upvoteLensPost } from '@/providers/lens/upvoteLensPost.js';
import { type Account as FireflyAccount } from '@/providers/types/Account.js';
import { type NotificationSettings } from '@/providers/types/Firefly.js';
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

@WithMutedProfilesQuery()
@SetQueryDataForLikePost(Source.Lens)
@SetQueryDataForBookmarkPost(Source.Lens)
@SetQueryDataForMirrorPost(Source.Lens)
@SetQueryDataForCommentPost(Source.Lens)
@SetQueryDataForDeletePost(Source.Lens)
@SetQueryDataForBlockProfile(Source.Lens)
@SetQueryDataForFollowProfile(Source.Lens)
@SetQueryDataForActPost(Source.Lens)
@SetQueryDataForReportPost(Source.Lens)
@SetQueryDataForJoinChannel(Source.Lens)
@SetQueryDataForPosts
@AddAuthorHighlightStatusForPosts(Source.Lens)
class LensSocialMedia implements Provider {
    get type() {
        return SessionType.Lens;
    }

    getFriendship(profileId: string): Promise<Friendship | null> {
        throw new NotImplementedError();
    }

    async getChannelById(channelId: string, includeFollowingStatus?: boolean, ownerId?: string): Promise<Channel> {
        return getLensChannelById(channelId, includeFollowingStatus, ownerId);
    }

    async getChannelsByIds(ids: string[]): Promise<Channel[]> {
        return Promise.all(ids.map((id) => getLensChannelById(id)));
    }

    getChannelByHandle(channelHandle: string): Promise<Channel> {
        throw new NotImplementedError();
    }

    async getChannelsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Channel, PageIndicator>> {
        return getLensChannelsByProfileId(profileId, indicator);
    }

    async discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return discoverLensChannels(indicator);
    }

    async getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getLensPostsByChannelId(channelId, indicator);
    }

    getPostsByChannelHandle(channelHandle: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return searchLensChannels(q, indicator);
    }

    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return getLensChannelMembers(channelId, indicator);
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getLikedPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
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

    getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        throw new NotImplementedError();
    }

    async deletePost(postId: string): Promise<boolean> {
        return deleteLensPost(postId);
    }

    async publishPost(draftPost: Post): Promise<{ postId: string }> {
        return publishLensPost(draftPost);
    }

    async mirrorPost(postId: string): Promise<string> {
        return mirrorLensPost(postId);
    }

    async unmirrorPost(postId: string): Promise<void> {
        await unmirrorLensPost(postId);
    }

    // intro is the contentURI of the post
    async quotePost(postId: string, draftPost: Post): Promise<{ postId: string }> {
        return quoteLensPost(postId, draftPost);
    }

    async collectPost(postId: string): Promise<void> {
        await collectLensPost(postId);
    }

    async actPost(postId: string) {
        await actLensPost(postId);
    }

    // comment is the contentURI of the post
    async commentPost(postId: string, draftPost: Post, signless?: boolean): Promise<{ postId: string }> {
        return commentLensPost(postId, draftPost, signless);
    }

    async upvotePost(postId: string) {
        await upvoteLensPost(postId);
    }

    async unvotePost(postId: string): Promise<void> {
        await unvoteLensPost(postId);
    }

    async getProfileById(profileId: string, includeGraphStats?: boolean): Promise<Profile> {
        return getLensProfileById(profileId, includeGraphStats);
    }

    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        return getLensProfilesByIds(ids);
    }

    async getProfileByHandle(handle: string, includeGraphStats?: boolean): Promise<Profile> {
        return getLensProfileByHandle(handle, includeGraphStats);
    }

    async getProfileBySession(session: Session): Promise<Profile> {
        return getLensProfileBySession(session as LensSession);
    }

    async getProfileByIdOrHandle(profileIdOrHandle: string, includeGraphStats?: boolean): Promise<Profile> {
        if (isValidAddressEthereum(profileIdOrHandle)) return getLensProfileById(profileIdOrHandle, includeGraphStats);
        return getLensProfileByHandle(profileIdOrHandle, includeGraphStats);
    }

    async getPostById(postId: string, isLegacy = false): Promise<Post> {
        return getLensPostById(postId, isLegacy);
    }

    async getCommentsById(
        postId: string,
        indicator?: PageIndicator,
        hasFilter = true,
    ): Promise<Pageable<Post, PageIndicator>> {
        return getCommentsByPostId(postId, indicator, hasFilter);
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return discoverLensPosts(indicator);
    }

    async discoverPostsById(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return discoverLensPostsById(profileId, indicator);
    }

    async getCollectedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return getLensCollectedPostsByProfileId(profileId, indicator);
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getLensPostsByProfileId(profileId, indicator);
    }

    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return getLensRepliesPostsByProfileId(profileId, indicator);
    }

    async getMediaPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        return getLensMediaPostsByProfileId(profileId, indicator);
    }

    // TODO: Invalid
    async getPostsBeMentioned(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        return getLensPostsBeMentioned(profileId, indicator);
    }

    async getPostsLiked(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    async getPostsReplies(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        return getLensPostsReplies(profileId, indicator);
    }

    async follow(profileId: string): Promise<boolean> {
        return followLensProfile(profileId);
    }

    async unfollow(profileId: string): Promise<boolean> {
        return unfollowLensProfile(profileId);
    }

    async getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        return getLensFollowers(profileId, indicator);
    }

    async getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        return getLensFollowings(profileId, indicator);
    }
    async getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return getLensMutualFollowers(profileId, indicator);
    }

    async isFollowedByMe(profileId: string): Promise<boolean> {
        return isLensFollowedByMe(profileId);
    }

    async isFollowingMe(profileId: string): Promise<boolean> {
        return isLensFollowingMe(profileId);
    }

    async getNotifications(
        indicator?: PageIndicator,
        highSignalFilter?: boolean,
    ): Promise<Pageable<Notification, PageIndicator>> {
        return getLensNotifications(indicator, highSignalFilter);
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        return getLensNotificationSettings();
    }

    async setNotificationSettings(settings: NotificationSettings) {
        return setLensNotificationSettings(settings);
    }

    async getSuggestedFollows(indicator?: PageIndicator): Promise<Pageable<Profile>> {
        return getLensSuggestedFollows(indicator);
    }

    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return searchLensProfiles(q, indicator);
    }

    async searchPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return searchLensPosts(q, indicator);
    }

    async getThreadByPostId(postId: string, post?: Post) {
        return getLensThreadByPostId(postId, post);
    }

    async blockProfile(profileId: string) {
        return blockLensProfile(profileId);
    }

    async unblockProfile(profileId: string) {
        return unblockLensProfile(profileId);
    }

    async getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getLikeReactors(postId: string, indicator?: PageIndicator) {
        return getLensLikeReactors(postId, indicator);
    }
    async getRepostReactors(postId: string, indicator?: PageIndicator) {
        return getLensRepostReactors(postId, indicator);
    }

    async getPostsQuoteOn(postId: string, indicator?: PageIndicator) {
        return getLensPostsQuoteOn(postId, indicator);
    }
    async bookmark(postId: string): Promise<boolean> {
        return bookmarkLensPost(postId);
    }

    async unbookmark(postId: string): Promise<boolean> {
        return unbookmarkLensPost(postId);
    }

    async getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return getLensBookmarks(indicator);
    }

    async getHiddenComments(postId: string, indicator?: PageIndicator) {
        return getLensHiddenComments(postId, indicator);
    }

    async reportProfile(profileId: string) {
        return reportLensProfile(profileId);
    }

    async reportPost(post: Post) {
        return reportLensPost(post);
    }

    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        return updateLensProfile(profile);
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        return joinLensChannel(channel);
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        return leaveLensChannel(channel);
    }

    async getPinnedPost(profileId: string): Promise<Post | null> {
        throw new NotImplementedError();
    }

    async decryptPost(post: Post): Promise<Post | null> {
        throw new NotImplementedError();
    }

    async createAccount(profile: ProfileForSignup): Promise<FireflyAccount> {
        return createLensAccount(profile);
    }
}

export { LensSocialMedia };
export const lensSocialMediaProvider = new LensSocialMedia();
