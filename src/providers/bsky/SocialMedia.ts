import { type AppBskyActorProfile, type AppBskyFeedDefs, moderatePost } from '@atproto/api';
import { BlockedActorError } from '@atproto/api/dist/client/types/app/bsky/feed/getAuthorFeed.js';
import { NotImplementedError, safeUnreachable } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';
import { compact, has, uniq } from 'lodash-es';
import urlcat from 'urlcat';

import { DISCOVER_AT_URI } from '@/constants/bsky.js';
import { BookmarkType, FireflyPlatform, Source } from '@/constants/enum.js';
import { BSKY_LOGIN_REQUIRED_FEEDS, EMPTY_LIST } from '@/constants/static.js';
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
import { fetchBlob } from '@/helpers/fetchBlob.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { isZero } from '@/helpers/number.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { ChannelAtUri, PostAtUri } from '@/providers/bsky/AtUri.js';
import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { convertBskyHandleToDid } from '@/providers/bsky/convertBskyHandleToDid.js';
import { formatBskyChannel } from '@/providers/bsky/formatBskyChannel.js';
import { formatBskyFeedPost, formatBskyPost, formatBskyThreadPosts } from '@/providers/bsky/formatBskyFeedPost.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { getBskyProfileBySession } from '@/providers/bsky/getBskyProfileBySession.js';
import { getBskySuggestedUsers } from '@/providers/bsky/getBskySuggestedUsers.js';
import { publishPostToBsky } from '@/providers/bsky/publishPostToBsky.js';
import { resolveBskyResponseData, resolveBskyResponseDataAsync } from '@/providers/bsky/resolveBskyResponseData.js';
import { type BskySession } from '@/providers/bsky/Session.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { fireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { type Account } from '@/providers/types/Account.js';
import { type BookmarkResponse, type NotificationSettings, type WalletProfile } from '@/providers/types/Firefly.js';
import { type Session } from '@/providers/types/Session.js';
import {
    type Channel,
    type CommentNotification,
    type FollowNotification,
    type Friendship,
    type MentionNotification,
    type MirrorNotification,
    type NetworkType,
    type Notification,
    NotificationType,
    type Post,
    type Profile,
    type ProfileBadge,
    type ProfileEditable,
    type ProfileForSignup,
    type Provider,
    type QuoteNotification,
    type ReactionNotification,
    SessionType,
} from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

async function getPostById(postId: string): Promise<Post> {
    const atUri = PostAtUri.fromId(postId).toUri();
    return getPostByUri(atUri);
}

async function getPostByUri(uri: string): Promise<Post> {
    const data = await resolveBskyResponseDataAsync(
        () =>
            bskySessionHolder.agent.getPostThread({
                uri,
                depth: 10,
            }),
        `Failed to getSinglePost uri = ${uri}.`,
    );

    const thread = AppBskyFeed.isThreadViewPost(data.thread) ? data.thread : null;
    if (!thread) throw new Error(`No thread found uri = ${uri}.`);
    return formatBskyFeedPost(thread);
}

async function getProfileById(profileId: string) {
    const data = await resolveBskyResponseDataAsync(
        () => bskySessionHolder.agent.getProfile({ actor: profileId }),
        `Failed to get profile id = ${profileId}.`,
    );
    return formatBskyProfile(data);
}

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

    async publishPost(post: Post) {
        const result = await publishPostToBsky(post, false);

        return {
            postId: result.cid,
            contentURI: result.uri,
        };
    }

    async deletePost(postId: string): Promise<boolean> {
        const atUri = PostAtUri.fromId(postId).toUri();
        await bskySessionHolder.agent.deletePost(atUri);
        return true;
    }
    async mirrorPost(postId: string, authorId?: number): Promise<string> {
        const post = await getPostById(postId);
        if (!post.metadata.contentURI) throw new Error(`Failed to mirror post postId = ${postId}`);
        const response = await bskySessionHolder.agent.repost(post.metadata.contentURI, post.publicationId);
        return response.uri;
    }
    async unmirrorPost(postId: string, authorId?: number): Promise<void> {
        const response = await bskySessionHolder.agent.getPostThread({
            uri: PostAtUri.fromId(postId).toUri(),
            depth: 0,
        });
        const data = resolveBskyResponseData(response, `Failed to unmirror post postId = ${postId}`);
        if (!AppBskyFeed.isThreadViewPost(data.thread) || !data.thread.post.viewer?.repost)
            throw new Error(`Failed to unmirror post postId = ${postId}`);
        await bskySessionHolder.agent.deleteRepost(data.thread.post.viewer.repost);
    }
    async quotePost(postId: string, post: Post): Promise<{ postId: string; contentURI?: string }> {
        const result = await publishPostToBsky(post, true);

        return {
            postId: result.cid,
            contentURI: result.uri,
        };
    }
    async commentPost(postId: string, post: Post): Promise<{ postId: string; contentURI?: string }> {
        return bskySocialMediaProvider.publishPost(post);
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
        const post = await getPostById(postId);
        if (!AppBskyFeed.isThreadViewPost(post.__original__)) throw new Error(`Failed to like post postId = ${postId}`);
        await bskySessionHolder.agent.like(post.__original__.post.uri, post.__original__.post.cid);
    }
    async unvotePost(postId: string): Promise<void> {
        const response = await bskySessionHolder.agent.getPostThread({
            uri: PostAtUri.fromId(postId).toUri(),
            depth: 0,
        });
        const data = resolveBskyResponseData(response, `Failed to unlike post postId = ${postId}`);
        if (!AppBskyFeed.isThreadViewPost(data.thread) || !data.thread.post.viewer?.like)
            throw new Error(`Failed to unlike post postId = ${postId}`);
        await bskySessionHolder.agent.deleteLike(data.thread.post.viewer.like);
    }
    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        const response = await bskySessionHolder.agent.getProfiles({ actors: ids });
        const data = resolveBskyResponseData(response, `Failed to get profiles ids = ${ids.join(',')}.`);
        return data.profiles.map((profile) => formatBskyProfile(profile));
    }
    async getChannelsByIds(ids: string[]): Promise<Channel[]> {
        const response = await bskySessionHolder.agent.app.bsky.feed.getFeedGenerators({
            feeds: ids.map((id) => ChannelAtUri.fromId(id).toUri()),
        });
        const data = resolveBskyResponseData(response, `Failed to get channels ids = ${ids.join(',')}.`);
        return data.feeds.map(formatBskyChannel);
    }
    async getProfileById(profileId: string): Promise<Profile> {
        return getProfileById(profileId);
    }
    async getProfileByHandle(handle: string): Promise<Profile> {
        const did = await convertBskyHandleToDid(handle);
        return getProfileById(did || handle);
    }
    async getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        return getProfileById(profileIdOrHandle);
    }
    async getProfileBySession(session: Session): Promise<Profile> {
        return getBskyProfileBySession(session as BskySession);
    }
    async getPostById(postId: string): Promise<Post> {
        return getPostById(postId);
    }
    async getChannelById(channelId: string, includeFollowingStatus?: boolean): Promise<Channel> {
        const atUri = ChannelAtUri.fromId(channelId).toUri();
        const response = await bskySessionHolder.agent.app.bsky.feed.getFeedGenerator({
            feed: atUri,
        });
        const data = resolveBskyResponseData(response, 'Failed to query channel.');
        const channel = formatBskyChannel(data.view);
        if (isServer) return channel;

        const session = getSessionFromStorage(SessionType.Bsky);
        if (session?.profileId && includeFollowingStatus) {
            const response = await runInSafeAsync(() => bskySessionHolder.agent.getPreferences());
            channel.isMember = response?.savedFeeds.some((x) => x.value === channel.url);
        }

        return channel;
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
        const atUri = PostAtUri.fromId(postId).toUri();
        const response = await bskySessionHolder.agent.getPostThread({
            uri: atUri,
            depth: 10,
        });
        const data = resolveBskyResponseData(response, `Failed to getCommentsById atUri = ${atUri}.`);
        const did = bskySessionHolder.session?.did;
        if (!AppBskyFeed.isThreadViewPost(data.thread)) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }
        const preferences = await runInSafeAsync(() => bskySessionHolder.agent.getPreferences());
        const replies = compact(
            data.thread.replies?.map((x) => {
                if (!AppBskyFeed.isThreadViewPost(x)) return null;
                if (preferences) {
                    const moderationDecision = moderatePost(x.post, {
                        userDid: did,
                        prefs: preferences.moderationPrefs,
                    });
                    if (moderationDecision.causes.length) return null;
                }
                return formatBskyFeedPost(x);
            }),
        );
        return createPageable(replies, createIndicator(indicator));
    }
    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const response = await bskySessionHolder.agent.app.bsky.feed.getFeed({
            feed: DISCOVER_AT_URI,
            cursor: indicator?.id,
        });
        const data = resolveBskyResponseData(response, 'Failed to discoverPosts');

        return createPageable(
            data.feed.map(formatBskyFeedPost),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        const response = await bskySessionHolder.agent.app.bsky.unspecced.getPopularFeedGenerators({
            cursor: indicator?.id,
            limit: 20,
        });
        const data = resolveBskyResponseData(response, 'Failed to discoverChannels');
        const result = bskySessionHolder.session
            ? data.feeds
            : data.feeds.filter((x) => !BSKY_LOGIN_REQUIRED_FEEDS.includes(x.uri));
        return createPageable(
            result.map(formatBskyChannel),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async discoverPostsById(
        profileId: string,
        indicator?: PageIndicator,
        signal?: AbortSignal,
    ): Promise<Pageable<Post, PageIndicator>> {
        const response = await bskySessionHolder.agent.getTimeline(
            {
                cursor: indicator?.id,
            },
            {
                signal,
            },
        );
        const data = resolveBskyResponseData(response, 'Failed to discoverPosts');
        return createPageable(
            data.feed.map(formatBskyFeedPost),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        try {
            const response = await bskySessionHolder.agent.getAuthorFeed({
                actor: profileId,
                filter: 'posts_and_author_threads',
                cursor: indicator?.id,
            });
            const data = resolveBskyResponseData(response, `Failed to get post by profile id = ${profileId}.`);
            return createPageable(
                data.feed.map(formatBskyFeedPost),
                createIndicator(indicator),
                data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
            );
        } catch (error) {
            if (error instanceof BlockedActorError) {
                return createPageable([], createIndicator(indicator), undefined);
            }
            throw error;
        }
    }
    async getLikedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const response = await bskySessionHolder.agent.getActorLikes({
            actor: profileId,
            cursor: indicator?.id,
        });
        const data = resolveBskyResponseData(response, `Failed to get liked post by profile id = ${profileId}.`);
        return createPageable(
            data.feed.map(formatBskyFeedPost),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const response = await bskySessionHolder.agent.getAuthorFeed({
            actor: profileId,
            filter: 'posts_with_replies',
            cursor: indicator?.id,
        });
        const data = resolveBskyResponseData(response, `Failed to get replies post by profile id = ${profileId}.`);
        return createPageable(
            data.feed.map(formatBskyFeedPost).filter((x) => x.type !== 'Mirror'),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const atUri = ChannelAtUri.fromId(channelId).toUri();
        const response = await bskySessionHolder.agent.app.bsky.feed.getFeed({
            feed: atUri,
            cursor: indicator?.id,
        });
        const data = resolveBskyResponseData(response, 'Failed to get posts');
        return createPageable(
            data.feed.map(formatBskyFeedPost),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
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
        await bskySessionHolder.agent.follow(profileId);
        return true;
    }
    async unfollow(profileId: string): Promise<boolean> {
        const response = await bskySessionHolder.agent.getProfile({
            actor: profileId,
        });
        const data = resolveBskyResponseData(response, `Failed to unfollow profileId = ${profileId}`);
        const followUri = data.viewer?.following;
        if (!followUri) throw new Error(`No follow uri found profileId = ${profileId}`);

        await bskySessionHolder.agent.deleteFollow(followUri);
        return true;
    }

    async getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const response = await bskySessionHolder.agent.getFollowers({
            actor: profileId,
            cursor: indicator?.id,
            limit: 25,
        });
        const data = await bskySocialMediaProvider.getProfilesByIds(response.data.followers.map((x) => x.did));
        return createPageable(
            data,
            createIndicator(indicator),
            response.data.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
        );
    }

    async getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const response = await bskySessionHolder.agent.getFollows({
            actor: profileId,
            cursor: indicator?.id,
            limit: 25,
        });
        const data = await bskySocialMediaProvider.getProfilesByIds(response.data.follows.map((x) => x.did));
        return createPageable(
            data,
            createIndicator(indicator),
            response.data.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
        );
    }

    async getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const response = await bskySessionHolder.agent.app.bsky.graph.getKnownFollowers({
            actor: profileId,
            cursor: indicator?.id,
            limit: 25,
        });
        const data = await bskySocialMediaProvider.getProfilesByIds(response.data.followers.map((x) => x.did));
        return createPageable(
            data,
            createIndicator(indicator),
            response.data.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
        );
    }
    async isFollowedByMe(profileId: string): Promise<boolean> {
        const response = await bskySessionHolder.agent.getProfile({
            actor: profileId,
        });
        return !!response.data.viewer?.following;
    }
    async isFollowingMe(profileId: string): Promise<boolean> {
        const response = await bskySessionHolder.agent.getProfile({
            actor: profileId,
        });
        return !!response.data.viewer?.followedBy;
    }
    async getNotifications(
        indicator?: PageIndicator,
        highSignalFilter?: boolean,
    ): Promise<Pageable<Notification, PageIndicator>> {
        const response = await bskySessionHolder.agent.listNotifications({
            limit: 25,
            cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
        });
        const data = resolveBskyResponseData(response, 'Failed to get notifications.');

        const postIds = uniq(
            compact(
                data.notifications.flatMap((x) => {
                    switch (x.reason) {
                        case 'like':
                            return [(x.record as { subject: { uri: string } }).subject.uri];
                        case 'reply':
                            const parentUri = (x.record as { reply: { parent: { uri: string } } })?.reply?.parent?.uri;
                            if (!parentUri) return EMPTY_LIST;

                            return [x.uri, parentUri];
                        case 'quote':
                            if (!x.reasonSubject) return EMPTY_LIST;

                            return [x.uri, x.reasonSubject];
                        case 'repost':
                            if (!x.reasonSubject) return [];
                            return [x.reasonSubject];
                        default:
                            return [];
                    }
                }),
            ),
        );
        const posts = postIds.length
            ? await runInSafeAsync(async () => {
                  const res = await bskySessionHolder.agent.getPosts({
                      uris: postIds,
                  });
                  return resolveBskyResponseData(res).posts?.map((x) => formatBskyPost(x));
              })
            : EMPTY_LIST;

        const notifications = compact(
            await Promise.all(
                data.notifications.map(async (x) => {
                    const timestamp = x.indexedAt ? new Date(x.indexedAt).getTime() : undefined;

                    switch (x.reason) {
                        case 'follow':
                            return {
                                source: Source.Bsky,
                                notificationId: x.cid,
                                type: NotificationType.Follow,
                                followers: [formatBskyProfile(x.author)],
                            } satisfies FollowNotification;
                        case 'like':
                            const postUri = (x.record as { subject: { uri: string } }).subject.uri;
                            const post = posts?.find((p) => p.metadata.contentURI === postUri);
                            if (!post) return null;

                            return {
                                source: Source.Bsky,
                                notificationId: x.cid,
                                type: NotificationType.Reaction,
                                reactors: [formatBskyProfile(x.author)],
                                post,
                                timestamp,
                            } satisfies ReactionNotification;
                        case 'reply':
                            const parentUri = (x.record as { reply: { parent: { uri: string } } })?.reply?.parent?.uri;
                            if (!parentUri) return null;

                            const comment = posts?.find((p) => p.metadata.contentURI === x.uri);
                            const parentPost = posts?.find((p) => p.metadata.contentURI === parentUri);
                            if (!comment || !parentPost) return null;

                            return {
                                source: Source.Bsky,
                                notificationId: x.cid,
                                type: NotificationType.Comment,
                                comment: comment
                                    ? {
                                          ...comment,
                                          type: 'Comment',
                                          commentOn: parentPost,
                                      }
                                    : null,
                                post: parentPost,
                                timestamp,
                            } satisfies CommentNotification;
                        case 'mention':
                            return {
                                source: Source.Bsky,
                                notificationId: x.cid,
                                type: NotificationType.Mention,
                                post: formatBskyFeedPost({ post: x } as AppBskyFeedDefs.FeedViewPost),
                                timestamp,
                            } satisfies MentionNotification;
                        case 'quote':
                            if (!x.reasonSubject) return null;

                            const quote = posts?.find((p) => p.metadata.contentURI === x.uri);
                            const targetPost = posts?.find((p) => p.metadata.contentURI === x.reasonSubject);
                            if (!quote || !targetPost) return null;

                            return {
                                source: Source.Bsky,
                                notificationId: x.cid,
                                type: NotificationType.Quote,
                                quote: {
                                    ...quote,
                                    type: 'Quote',
                                    quoteOn: targetPost,
                                },
                                post: targetPost,
                                timestamp,
                            } satisfies QuoteNotification;
                        case 'repost':
                            if (!x.reasonSubject) return null;

                            const originalPost = posts?.find((p) => p.metadata.contentURI === x.reasonSubject);
                            if (!originalPost) return null;

                            return {
                                source: Source.Bsky,
                                notificationId: x.cid,
                                type: NotificationType.Mirror,
                                mirrors: [formatBskyProfile(x.author)],
                                post: originalPost,
                                timestamp,
                            } satisfies MirrorNotification;
                        case 'starterpack-joined':
                            return null;
                        default:
                            safeUnreachable(x.reason as never);
                            return null;
                    }
                }),
            ),
        );

        return createPageable(
            notifications,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        const response = await bskySessionHolder.agent.listNotifications({
            limit: 1,
        });

        return {
            priority: response.data?.priority ?? false,
        };
    }

    async setNotificationSettings(settings: NotificationSettings): Promise<boolean> {
        const response = await bskySessionHolder.agent.app.bsky.notification.putPreferences({
            priority: settings.priority,
        });
        if (!response.success) return false;

        return true;
    }

    async getSuggestedFollows(indicator?: PageIndicator, includeFollowingStatus?: boolean) {
        if (!bskySessionHolder.session) {
            return createPageable([], indicator);
        }

        return getBskySuggestedUsers(indicator, { limit: 20, queryStats: includeFollowingStatus });
    }

    async searchProfiles(q: string, indicator?: PageIndicator, limit = 25): Promise<Pageable<Profile, PageIndicator>> {
        const response = await bskySessionHolder.agent.searchActors({
            q,
            limit,
            cursor: indicator?.id,
        });
        const data = resolveBskyResponseData(response, `Failed to search profiles by query = ${q}.`);

        return createPageable(
            data.actors.map((x) => formatBskyProfile(x)),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async searchPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const response = await bskySessionHolder.agent.app.bsky.feed.searchPosts({
            q,
            sort: 'latest',
            limit: 25,
            cursor: indicator?.id,
        });
        const data = resolveBskyResponseData(response, `Failed to search posts by query = ${q}.`);

        return createPageable(
            data.posts.map((x) => formatBskyFeedPost({ post: x })),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        const response = await bskySessionHolder.agent.app.bsky.unspecced.getPopularFeedGenerators({
            limit: 20,
            query: q,
            cursor: indicator?.id,
        });
        const data = resolveBskyResponseData(response, `Failed to search channels by query = ${q}.`);

        return createPageable(
            data.feeds.map(formatBskyChannel),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async getThreadByPostId(postId: string, localPost?: Post): Promise<Post[]> {
        const uri = AppBskyFeed.isPostView(localPost?.__original__)
            ? localPost?.__original__.uri
            : PostAtUri.fromId(postId).toUri();
        const response = await bskySessionHolder.agent.getPostThread({
            uri,
            depth: 10,
        });
        const data = resolveBskyResponseData(response, `Failed to getThreadByPostId uri = ${uri}.`);
        const thread = AppBskyFeed.isThreadViewPost(data.thread) ? data.thread : null;
        if (!thread) throw new Error(`No thread found uri = ${uri}.`);

        return formatBskyThreadPosts(thread);
    }
    async getLikeReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const atUri = PostAtUri.fromId(postId).toUri();
        const response = await bskySessionHolder.agent.getLikes({
            uri: atUri,
            cursor: indicator?.id,
            limit: 25,
        });
        const data = resolveBskyResponseData(response, `Failed to get like reactors postId = ${postId}.`);
        const likes = data.likes || EMPTY_LIST;
        const profiles = likes.length
            ? await runInSafeAsync(() => bskySocialMediaProvider.getProfilesByIds(likes.map((x) => x.actor.did)))
            : EMPTY_LIST;

        return createPageable(
            profiles?.length ? profiles : likes.map((x) => formatBskyProfile(x.actor)),
            createIndicator(indicator),
            response.data.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
        );
    }
    async getRepostReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const atUri = PostAtUri.fromId(postId).toUri();
        const response = await bskySessionHolder.agent.getRepostedBy({
            uri: atUri,
            cursor: indicator?.id,
            limit: 25,
        });
        const data = resolveBskyResponseData(response, `Failed to get repost reactors postId = ${postId}.`);
        const repostedBy = data.repostedBy || EMPTY_LIST;
        const profiles = repostedBy.length
            ? await runInSafeAsync(() => bskySocialMediaProvider.getProfilesByIds(repostedBy.map((x) => x.did)))
            : EMPTY_LIST;

        return createPageable(
            profiles?.length ? profiles : repostedBy.map((x) => formatBskyProfile(x)),
            createIndicator(indicator),
            response.data.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
        );
    }
    async getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const atUri = PostAtUri.fromId(postId).toUri();
        const response = await bskySessionHolder.agent.app.bsky.feed.getQuotes({
            uri: atUri,
        });
        const data = resolveBskyResponseData(response, `Failed to getPostsQuoteOn postId = ${postId}.`);
        return createPageable(
            data.posts.map((x) => formatBskyPost(x)),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async bookmark(
        postId: string,
        platform?: FireflyPlatform,
        profileId?: string,
        postType?: BookmarkType,
    ): Promise<boolean> {
        return fireflySocialMediaProvider.bookmark(postId, FireflyPlatform.Bsky, profileId, postType);
    }
    async unbookmark(postId: string): Promise<boolean> {
        return fireflySocialMediaProvider.unbookmark(postId);
    }
    async getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/find', {
            post_type: BookmarkType.All,
            platforms: FireflyPlatform.Bsky,
            limit: 25,
            cursor: indicator?.id || undefined,
        });
        const response = await fireflySessionHolder.fetch<BookmarkResponse<{}>>(url);
        const uris = response.data?.list.map((x) => PostAtUri.fromId(x.post_id).toUri()) || EMPTY_LIST;
        const posts = uris.length
            ? resolveBskyResponseData(
                  await bskySessionHolder.agent.getPosts({
                      uris,
                  }),
              ).posts
            : EMPTY_LIST;

        return createPageable(
            posts.map((x) => ({ ...formatBskyPost(x), hasBookmarked: true })),
            createIndicator(indicator),
            response.data?.cursor ? createNextIndicator(indicator, `${response.data.cursor}`) : undefined,
        );
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
        const response = await bskySessionHolder.agent.mute(profileId);
        return response.success;
    }
    async unblockProfile(profileId: string): Promise<boolean> {
        const response = await bskySessionHolder.agent.unmute(profileId);
        return response.success;
    }
    async getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const response = await bskySessionHolder.agent.app.bsky.graph.getMutes({
            cursor: indicator?.id,
        });
        const data = resolveBskyResponseData(response, 'Failed to get blocked profiles.');
        return createPageable(
            data.mutes.map((x) => formatBskyProfile(x)),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
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
        await bskySessionHolder.agent.upsertProfile(async (existing) => {
            const nextProfileData = (existing || {}) as AppBskyActorProfile.Main;

            if (has(profile, 'displayName')) {
                nextProfileData.displayName = profile.displayName;
            }
            if (has(profile, 'bio')) {
                nextProfileData.description = profile.bio;
            }
            if (profile.pfp) {
                const avatarBlob = await fetchBlob(profile.pfp);
                const avatarBlobUploaded = await bskySessionHolder.agent.uploadBlob(avatarBlob);
                nextProfileData.avatar = avatarBlobUploaded.data.blob;
            }

            return nextProfileData;
        });
        return true;
    }

    async getHiddenComments(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const atUri = PostAtUri.fromId(postId).toUri();
        const response = await bskySessionHolder.agent.getPostThread({
            uri: atUri,
            depth: 10,
        });
        const data = resolveBskyResponseData(response, `Failed to getHiddenComments atUri = ${atUri}.`);
        const did = bskySessionHolder.session?.did;
        if (!AppBskyFeed.isThreadViewPost(data.thread) || !did) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }
        const preferences = await runInSafeAsync(() => bskySessionHolder.agent.getPreferences());
        if (!preferences) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }
        const replies = compact(
            data.thread.replies?.map((x) => {
                if (!AppBskyFeed.isThreadViewPost(x)) return null;
                const moderationDecision = moderatePost(x.post, {
                    userDid: did,
                    prefs: preferences.moderationPrefs,
                });
                if (!moderationDecision.causes.length) return null;
                return formatBskyFeedPost(x);
            }),
        );
        return createPageable(replies, createIndicator(indicator));
    }
    async getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        throw new NotImplementedError();
    }
    async joinChannel(channel: Channel): Promise<boolean> {
        const response = await bskySessionHolder.agent.addSavedFeeds([
            {
                pinned: false,
                type: 'feed',
                value: channel.url,
            },
        ]);

        return !!response.find((x) => x.value === channel.url);
    }
    async leaveChannel(channel: Channel): Promise<boolean> {
        const response = await bskySessionHolder.agent.getPreferences();
        const result = response.savedFeeds.find((x) => x.value === channel.url);
        if (!result) return false;

        await bskySessionHolder.agent.overwriteSavedFeeds(response.savedFeeds.filter((x) => x.value !== channel.url));

        return true;
    }
    async getPinnedPost(profileId: string): Promise<Post | null> {
        const response = await bskySessionHolder.agent.getProfile({ actor: profileId });
        const data = resolveBskyResponseData(response, `Failed to get pinned post profileId = ${profileId}.`);
        const pinnedPost = data.pinnedPost;
        if (!pinnedPost) return null;

        const postThreadRes = await bskySessionHolder.agent.getPostThread({
            uri: pinnedPost?.uri,
        });
        if (!postThreadRes.success || !AppBskyFeed.isThreadViewPost(postThreadRes.data.thread)) return null;
        return formatBskyFeedPost(postThreadRes.data.thread);
    }
    async decryptPost(post: Post): Promise<Post | null> {
        throw new NotImplementedError();
    }
    async getMediaPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const response = await bskySessionHolder.agent.getAuthorFeed({
            actor: profileId,
            filter: 'posts_with_media',
            cursor: indicator?.id,
        });
        const data = resolveBskyResponseData(response, `Failed to get media post by profile id = ${profileId}.`);
        return createPageable(
            data.feed.map(formatBskyFeedPost),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async createAccount(profile: ProfileForSignup): Promise<Account> {
        throw new NotImplementedError();
    }
}

export const bskySocialMediaProvider = new BskySocialMedia();
