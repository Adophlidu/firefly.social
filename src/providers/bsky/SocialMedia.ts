import { RichText } from '@atproto/api';

import { type BookmarkType, type FireflyPlatform, Source } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
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
import { formatBskyProfile } from '@/helpers/formatBskyProfile.js';
import { createNextIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveBskyEmbed } from '@/helpers/resolveBskyEmbed.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';
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
export class BskySocialMedia implements Provider {
    get type() {
        return SessionType.Bsky;
    }

    async publishPost(post: Post) {
        const text = post.metadata.content?.content;
        const richText = text ? new RichText({ text }) : undefined;
        if (richText) {
            await richText.detectFacets(bskySessionHolder.agent);
        }
        const result = await bskySessionHolder.agent.post({
            text: richText ? richText.text : text,
            createdAt: new Date().toISOString(),
            facets: richText ? richText.facets : undefined,
            embed: resolveBskyEmbed(post),
            reply:
                post.parentPostId && post.parentContentURI
                    ? {
                          parent: { cid: post.parentPostId, uri: post.parentContentURI },
                          root:
                              post.rootPostId && post.rootContentURI
                                  ? {
                                        cid: post.rootPostId,
                                        uri: post.rootContentURI,
                                    }
                                  : { cid: post.parentPostId, uri: post.parentContentURI },
                      }
                    : undefined,
        });

        return {
            postId: result.cid,
            contentURI: result.uri,
        };
    }

    async deletePost(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async mirrorPost(postId: string, options?: { onMomoka?: boolean; authorId?: number }): Promise<string> {
        throw new NotImplementedError();
    }
    async unmirrorPost(postId: string, authorId?: number): Promise<void> {
        throw new NotImplementedError();
    }
    async quotePost(postId: string, post: Post): Promise<{ postId: string; contentURI?: string }> {
        throw new NotImplementedError();
    }
    async commentPost(postId: string, post: Post): Promise<{ postId: string; contentURI?: string }> {
        throw new NotImplementedError();
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
        throw new NotImplementedError();
    }
    async unvotePost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }
    async getProfilesByAddress(address: string): Promise<Profile[]> {
        throw new NotImplementedError();
    }
    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        throw new NotImplementedError();
    }
    async getChannelsByIds(ids: string[]): Promise<Channel[]> {
        throw new NotImplementedError();
    }
    async getProfileById(profileId: string): Promise<Profile> {
        const response = await bskySessionHolder.agent.getProfile({ actor: profileId });
        if (!response.success) throw new Error(`Failed to get profile id = ${profileId}.`);

        return formatBskyProfile(response.data);
    }
    async getProfileByHandle(handle: string): Promise<Profile> {
        throw new NotImplementedError();
    }
    async getPostById(postId: string): Promise<Post> {
        throw new NotImplementedError();
    }
    async getChannelById(channelId: string): Promise<Channel> {
        throw new NotImplementedError();
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
    async getCommentsById(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }
    async discoverPostsById(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getLikedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
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
    async getPostsByParentPostId(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getFriendship(profileId: string): Promise<Friendship | null> {
        throw new NotImplementedError();
    }
    async getReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async follow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async unfollow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async isFollowedByMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async isFollowingMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async getNotifications(
        indicator?: PageIndicator,
        highSignalFilter?: boolean,
    ): Promise<Pageable<Notification, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getSuggestedFollows(indicator?: PageIndicator) {
        const size = 25;
        const res = await bskySessionHolder.agent.getSuggestions({
            limit: size,
            cursor: indicator?.id,
        });
        const detailedRes = await bskySessionHolder.agent.getProfiles({
            actors: res.data.actors.map((x) => x.did),
        });
        const profiles = detailedRes.data.profiles.map(formatBskyProfile);
        return createPageable(
            profiles,
            indicator,
            res.data.cursor ? createNextIndicator(indicator, res.data.cursor) : undefined,
        );
    }
    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async searchPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getThreadByPostId(postId: string, localPost?: Post): Promise<Post[]> {
        throw new NotImplementedError();
    }
    async getLikeReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getRepostReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
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
        throw new NotImplementedError();
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
    async reportProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async reportPost(post: Post): Promise<boolean> {
        throw new NotImplementedError();
    }
    async reportChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async getForYouPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getRecentPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        throw new NotImplementedError();
    }
    async getHiddenComments(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }
    async getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        throw new NotImplementedError();
    }
    async joinChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }
    async leaveChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }
    async getPinnedPost(profileId: string): Promise<Post> {
        throw new NotImplementedError();
    }
    async decryptPost(post: Post): Promise<Post | null> {
        throw new NotImplementedError();
    }
}

export const BskySocialMediaProvider = new BskySocialMedia();
