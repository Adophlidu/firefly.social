import { NotFoundError, NotImplementedError, UnauthorizedError } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';
import { compact, last, uniq } from 'lodash-es';
import { type TweetV2LookupResult } from 'twitter-api-v2';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { AddAuthorHighlightStatusForPosts } from '@/decorators/AddProfileHighlightStatus.js';
import { SetQueryDataForPosts } from '@/decorators/SetQueryDataForPosts.js';
import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import {
    patchPostClientToFirefly,
    patchPostsClientToFirefly,
    patchTweetsClientToFirefly,
} from '@/helpers/patchPostClientToFirefly.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getTwitterHandleById } from '@/providers/firefly/worker/getTwitterHandleById.js';
import { formatTwitterPostFromNitter } from '@/providers/nitter/formatTwitterPostFromNitter.js';
import { formatTwitterProfileFromNitter } from '@/providers/nitter/formatTwitterProfileFromNitter.js';
import { NitterAPIProvider } from '@/providers/nitter/Nitter.js';
import { tweetV2ToPost } from '@/providers/twitter/formatTwitterPost.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { type TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { type Account } from '@/providers/types/Account.js';
import { type NotificationSettings } from '@/providers/types/Firefly.js';
import { type Pagination, type Tweet, UserTimelineTab } from '@/providers/types/Nitter.js';
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
import { type ResponseJson } from '@/types/utility.js';

async function withFullStatusTimeline(timeline: Tweet[]) {
    timeline = timeline.flat();
    const tweetIds = uniq(timeline.map((x) => x.id).filter((x) => x && x !== '0')).join(',');
    const response = await twitterSessionHolder.fetchWithSession<ResponseJson<TweetV2LookupResult>>(
        urlcat(`/api/twitter/tweets/:tweetIds`, {
            tweetIds,
        }),
    );
    const data = resolveTwitterResponseData(response);
    return timeline.map((tweet) => {
        const tweetV2 = data.data?.find((x) => x.id === tweet.id);
        return formatTwitterPostFromNitter(tweet, {
            tweet: tweetV2,
            includes: data.includes,
        });
    });
}

async function withFullStatusTweetWithPagination(timeline: Tweet[], pagination: Pagination, indicator?: PageIndicator) {
    timeline = timeline.flat();
    if (twitterSessionHolder.session) {
        const data = await runInSafeAsync(() => withFullStatusTimeline(timeline));
        if (data) {
            return createPageable(
                await patchPostsClientToFirefly(data),
                createIndicator(indicator),
                pagination.bottom ? createNextIndicator(indicator, pagination.bottom) : undefined,
            );
        }
    }
    const data = await patchPostsClientToFirefly(timeline.map((tweet) => formatTwitterPostFromNitter(tweet)));
    return createPageable(
        data,
        createIndicator(indicator),
        pagination.bottom ? createNextIndicator(indicator, pagination.bottom) : undefined,
    );
}

async function withReplyPostsToTimeline(timeline: Tweet[]) {
    timeline = timeline.flat();
    const tweetIds = uniq(
        [...timeline.map((x) => x.replyId), ...timeline.map((x) => x.id)].filter((x) => x && x !== '0').join(','),
    );
    const response = await twitterSessionHolder.fetchWithSession<ResponseJson<TweetV2LookupResult>>(
        urlcat(`/api/twitter/tweets/:tweetIds`, {
            tweetIds,
        }),
    );
    const result = resolveTwitterResponseData(response);
    result.data = result.data ? await patchTweetsClientToFirefly(result.data) : EMPTY_LIST;
    return timeline.map((tweet) => {
        const tweetV2 = result.data?.find((x) => x.id === tweet.id);
        const commentTweetV2 = result.data?.find((x) => x.id === tweet.replyId);
        const commentOn = commentTweetV2 ? tweetV2ToPost(commentTweetV2) : undefined;
        return formatTwitterPostFromNitter(tweet, {
            base: { commentOn, commentLoadable: !commentOn },
            tweet: tweetV2,
            includes: result.includes,
        });
    });
}

async function withReplyPostsToTimelineWithPagination(
    timeline: Tweet[],
    pagination: Pagination,
    indicator?: PageIndicator,
) {
    timeline = timeline.flat();
    if (twitterSessionHolder.session) {
        const data = await runInSafeAsync(() => withReplyPostsToTimeline(timeline));
        if (data) {
            return createPageable(
                await patchPostsClientToFirefly(data),
                createIndicator(indicator),
                pagination.bottom ? createNextIndicator(indicator, pagination.bottom) : undefined,
            );
        }
    }
    const data = await patchPostsClientToFirefly(
        timeline.map((tweet) => formatTwitterPostFromNitter(tweet, { base: { commentLoadable: true } })),
    );
    return createPageable(
        data,
        createIndicator(indicator),
        pagination.bottom ? createNextIndicator(indicator, pagination.bottom) : undefined,
    );
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

    getSuggestedFollows(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    discoverPostsById(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getNotifications(indicator?: PageIndicator): Promise<Pageable<Notification, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        throw new NotImplementedError();
    }

    async setNotificationSettings(settings: NotificationSettings): Promise<boolean> {
        throw new NotImplementedError();
    }

    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
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

    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
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

    async getPostById(postId: string): Promise<Post> {
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
        const { tweet, before } = await NitterAPIProvider.getTweetStatus('web', postId);
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

    async getProfileById(profileId: string): Promise<Profile> {
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
        const username = await getTwitterHandleById(profileId);
        const { user } = await NitterAPIProvider.getProfileByHandle(username);
        return formatTwitterProfileFromNitter(user);
    }

    async getProfileByHandle(handle: string): Promise<Profile> {
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
        const { user } = await NitterAPIProvider.getProfileByHandle(handle);
        if (!user.id || user.id === '0')
            throw new NotFoundError(`The twitter profile not found with handle: ${handle}`);
        return formatTwitterProfileFromNitter(user);
    }

    async getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
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
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
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
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
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
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
        const { replies, after } = await NitterAPIProvider.getTweetStatus('web', postId, {
            cursor: indicator?.id,
        });
        const pageable = await runInSafeAsync(async () => {
            const data = [...(!indicator?.id ? [...after.tweets] : []), ...replies.tweets].map((tweet) =>
                formatTwitterPostFromNitter(tweet),
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
        return patchPostsClientToFirefly([
            ...before.tweets.map((x) => formatTwitterPostFromNitter(x)),
            formatTwitterPostFromNitter(tweet),
            ...after.tweets.map((x) => formatTwitterPostFromNitter(x)),
        ]);
    }

    upvotePost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    unvotePost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    async searchPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
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

    async publishPost(
        post: Post,
        options: {
            excludeReplyProfileIds?: string[];
        } = {},
    ): Promise<{ postId: string }> {
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

    async getPinnedPost(profileId: string): Promise<Post | null> {
        if (!isServer && twitterSessionHolder.session) throw new NotImplementedError();
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
