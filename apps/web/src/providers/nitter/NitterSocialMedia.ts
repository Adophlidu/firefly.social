import { EMPTY_LIST } from '@dimensiondev/constants';
import { NotFoundError, NotImplementedError, runInSafeAsync, UnauthorizedError } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';
import { compact, last } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { TweetUnavailableError } from '@/constants/error.js';
import { AddAuthorHighlightStatusForPosts } from '@/decorators/AddProfileHighlightStatus.js';
import { SetQueryDataForPosts } from '@/decorators/SetQueryDataForPosts.js';
import { Throw } from '@/decorators/Throw.js';
import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { patchPostClientToFirefly, patchPostsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { getTwitterHandleById } from '@/providers/firefly/worker/getTwitterHandleById.js';
import { formatTwitterPostFromNitter } from '@/providers/nitter/formatTwitterPostFromNitter.js';
import { formatTwitterProfileFromNitter } from '@/providers/nitter/formatTwitterProfileFromNitter.js';
import { NitterAPIProvider } from '@/providers/nitter/Nitter.js';
import { withFullStatusTweetWithPagination } from '@/providers/nitter/withFullStatusTweetWithPagination.js';
import { withReplyPostsToTimelineWithPagination } from '@/providers/nitter/withReplyPostsToTimelineWithPagination.js';
import { type TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { type Account } from '@/providers/types/Account.js';
import { type NotificationSettings } from '@/providers/types/Firefly.js';
import { UserTimelineTab } from '@/providers/types/Nitter.js';
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

function notImplementedWhenClientHasTwitterSession(): boolean {
    return !isServer && Boolean(twitterSessionHolder.session);
}

@SetQueryDataForPosts
@AddAuthorHighlightStatusForPosts(Source.Twitter)
class NitterSocialMedia implements Provider {
    get type() {
        return SessionType.Twitter;
    }

    getFriendship(profileId: string): Promise<Friendship | null> {
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

    commentPost(postId: string, post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    collectPost(postId: string, collectionId?: string): Promise<void> {
        throw new NotImplementedError();
    }

    getHiddenComments(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    actPost(postId: string, options: unknown): Promise<void> {
        throw new NotImplementedError();
    }

    getPostsBeMentioned(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsLiked(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsReplies(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    isFollowedByMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    isFollowingMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getSuggestedFollows(
        _includeFollowingStatus?: boolean,
        _locale?: unknown,
        indicator?: PageIndicator,
    ): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    discoverPostsById(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getNotifications(
        _highSignalFilter?: boolean,
        indicator?: PageIndicator,
    ): Promise<Pageable<Notification, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        throw new NotImplementedError();
    }

    async setNotificationSettings(settings: NotificationSettings): Promise<boolean> {
        throw new NotImplementedError();
    }

    @Throw(() => new NotImplementedError(), notImplementedWhenClientHasTwitterSession)
    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const pageable = await runInSafeAsync(async () => {
            const { users, pagination } = await NitterAPIProvider.search(q, {
                cursor: indicator?.id,
                type: 'users',
            });
            const data = users.map((user) => formatTwitterProfileFromNitter(user));
            return createPageable(
                data,
                createIndicator(indicator),
                pagination.bottom ? createNextIndicator(indicator, pagination.bottom) : undefined,
            );
        });
        return pageable ?? createPageable(EMPTY_LIST, createIndicator(indicator));
    }

    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getChannelById(channelId: string): Promise<Channel> {
        throw new NotImplementedError();
    }

    getChannelsByIds(ids: string[]): Promise<Channel[]> {
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

    getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
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

    unmirrorPost(postId: string, authorId?: number | undefined): Promise<void> {
        throw new NotImplementedError();
    }

    mirrorPost(postId: string): Promise<string> {
        throw new NotImplementedError();
    }

    @Throw(() => new NotImplementedError(), notImplementedWhenClientHasTwitterSession)
    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        const profilesSettledResult = await Promise.allSettled(ids.map((id) => this.getProfileById(id)));
        return compact(profilesSettledResult.map((x) => (x.status === 'fulfilled' ? x.value : null)));
    }

    follow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unfollow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    @Throw(() => new NotImplementedError(), notImplementedWhenClientHasTwitterSession)
    async getPostById(postId: string): Promise<Post> {
        const { tweet, before } = await NitterAPIProvider.getTweetStatus('web', postId);

        if (!tweet.available) {
            throw new TweetUnavailableError(tweet.text || tweet.tombstone || undefined);
        }

        const commentOn = await patchPostClientToFirefly(
            before.tweets.length > 0 ? formatTwitterPostFromNitter(last(before.tweets)!) : undefined,
        );
        const post = formatTwitterPostFromNitter(tweet, { base: { commentOn } });
        // If timestamp is invalid (missing / negative), treat as unauthorized so caller can fallback to client-side fetching.
        if (typeof post.timestamp !== 'number' || post.timestamp < 0) {
            throw new UnauthorizedError('[NitterSocialMedia] Invalid (negative) timestamp.');
        }
        return patchPostClientToFirefly(post);
    }

    @Throw(() => new NotImplementedError(), notImplementedWhenClientHasTwitterSession)
    async getProfileById(profileId: string): Promise<Profile> {
        const username = await getTwitterHandleById(profileId);
        const { user } = await NitterAPIProvider.getProfileByHandle(username);
        return formatTwitterProfileFromNitter(user);
    }

    @Throw(() => new NotImplementedError(), notImplementedWhenClientHasTwitterSession)
    async getProfileByHandle(handle: string): Promise<Profile> {
        const { user } = await NitterAPIProvider.getProfileByHandle(handle);
        if (!user.id || user.id === '0')
            throw new NotFoundError(`The twitter profile not found with handle: ${handle}`);
        return formatTwitterProfileFromNitter(user);
    }

    @Throw(() => new NotImplementedError(), notImplementedWhenClientHasTwitterSession)
    async getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        if (isNumericalProfileId(profileIdOrHandle)) {
            // Using runInSafeAsync here to handle cases where a purely numerical handle might be passed
            const profile = await runInSafeAsync(() => this.getProfileById(profileIdOrHandle));
            if (profile) return profile;
        }
        return this.getProfileByHandle(profileIdOrHandle);
    }

    async getProfileBySession(session: Session): Promise<Profile> {
        const { profileId } = session as TwitterSession;
        return this.getProfileById(profileId);
    }

    getCollectedPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const username = await getTwitterHandleById(profileId);
        const pageable = await runInSafeAsync(async () => {
            const { timeline, pagination } = await NitterAPIProvider.getUserTimelineByHandle(username, {
                cursor: indicator?.id,
            });
            return withFullStatusTweetWithPagination(timeline, pagination, indicator);
        });
        return pageable ?? createPageable(EMPTY_LIST, createIndicator(indicator));
    }

    getLikedPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const username = await getTwitterHandleById(profileId);
        const pageable = await runInSafeAsync(async () => {
            const { timeline, pagination } = await NitterAPIProvider.getUserTimelineByHandle(username, {
                cursor: indicator?.id,
                tab: UserTimelineTab.WithReplies,
            });
            return withReplyPostsToTimelineWithPagination(timeline, pagination, indicator);
        });
        return pageable ?? createPageable(EMPTY_LIST, createIndicator(indicator));
    }

    async getCommentsById(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const { tweet, replies, after } = await NitterAPIProvider.getTweetStatus('web', postId, {
            cursor: indicator?.id,
        });
        const pageable = await runInSafeAsync(async () => {
            // Format the parent tweet as the commentOn for all comments
            // This ensures that when navigating from a comment list to a comment page,
            // the parent post (with all its media/attachments) is properly loaded
            const commentOn = formatTwitterPostFromNitter(tweet);
            const data = [...(!indicator?.id ? [...after.tweets] : []), ...replies.tweets].map((tweet) =>
                formatTwitterPostFromNitter(tweet, { base: { commentOn } }),
            );
            return createPageable(
                await patchPostsClientToFirefly(data),
                createIndicator(indicator),
                replies.bottom ? createNextIndicator(indicator, replies.bottom) : undefined,
            );
        });
        return pageable ?? createPageable(EMPTY_LIST, createIndicator(indicator));
    }

    async getThreadByPostId(postId: string): Promise<Post[]> {
        const { tweet, before, after } = await NitterAPIProvider.getTweetStatus('web', postId);

        // Combine all tweets into one array for processing
        const allTweets = [...before.tweets, tweet, ...after.tweets];

        // Build a map of tweets by ID for parent lookup
        const tweetMap = new Map(allTweets.map((t) => [t.id, t]));

        // Format each tweet with its parent as commentOn (if parent exists)
        const posts = allTweets.map((tweet) => {
            const parentTweet = tweet.replyId && tweet.replyId !== '0' ? tweetMap.get(tweet.replyId) : undefined;
            const commentOn = parentTweet ? formatTwitterPostFromNitter(parentTweet) : undefined;
            return formatTwitterPostFromNitter(tweet, { base: { commentOn } });
        });

        return patchPostsClientToFirefly(posts);
    }

    upvotePost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    unvotePost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    @Throw(() => new NotImplementedError(), notImplementedWhenClientHasTwitterSession)
    async searchPosts(
        q: string,
        _fullMatch?: boolean,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const pageable = await runInSafeAsync(async () => {
            const { timeline, pagination } = await NitterAPIProvider.search(q, {
                cursor: indicator?.id,
            });
            return withReplyPostsToTimelineWithPagination(timeline, pagination, indicator);
        });
        return pageable ?? createPageable(EMPTY_LIST, createIndicator(indicator));
    }

    async quotePost(postId: string, post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    async publishPost(post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    deletePost(tweetId: string): Promise<boolean> {
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

    bookmark(tweetId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    unbookmark(tweetId: string): Promise<boolean> {
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
    uploadProfileAvatar(file: File): Promise<string> {
        throw new NotImplementedError();
    }
    updateProfile(profile: ProfileEditable): Promise<boolean> {
        throw new NotImplementedError();
    }

    getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        throw new NotImplementedError();
    }

    joinChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    leaveChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    @Throw(() => new NotImplementedError(), notImplementedWhenClientHasTwitterSession)
    async getPinnedPost(profileId: string): Promise<Post | null> {
        const username = await getTwitterHandleById(profileId);
        const { pinned } = await NitterAPIProvider.getProfileByHandle(username);
        return patchPostClientToFirefly(formatTwitterPostFromNitter(pinned));
    }

    decryptPost(post: Post): Promise<Post> {
        throw new NotImplementedError();
    }

    async getMediaPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const pageable = await runInSafeAsync(async () => {
            const username = await getTwitterHandleById(profileId);
            const { timeline, pagination } = await NitterAPIProvider.getUserTimelineByHandle(username, {
                cursor: indicator?.id,
                tab: UserTimelineTab.Media,
            });

            return withFullStatusTweetWithPagination(timeline, pagination, indicator);
        });
        return pageable ?? createPageable(EMPTY_LIST, createIndicator(indicator));
    }

    async createAccount(profile: ProfileForSignup): Promise<Account> {
        throw new NotImplementedError();
    }
}

export { NitterSocialMedia };
export const nitterSocialMediaProvider = new NitterSocialMedia();
