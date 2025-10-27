import { isServer } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import type {
    SpaceV2SingleResult,
    TweetV2PaginableTimelineResult,
    Tweetv2TimelineResult,
    UserV2,
    UserV2MuteResult,
    UserV2TimelineResult,
} from 'twitter-api-v2';
import urlcat from 'urlcat';

import { FireflyPlatform, Locale, Source } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { TWITTER_PROFILE_SEARCH_REGEXP } from '@/constants/regexp.js';
import { AddLikeStatusToTwitterPosts } from '@/decorators/AddLikeStatusToTwitterPosts.js';
import { AddAuthorHighlightStatusForPosts } from '@/decorators/AddProfileHighlightStatus.js';
import { SetQueryDataForActPost } from '@/decorators/SetQueryDataForActPost.js';
import { SetQueryDataForBlockProfile } from '@/decorators/SetQueryDataForBlockProfile.js';
import { SetQueryDataForBookmarkPost } from '@/decorators/SetQueryDataForBookmarkPost.js';
import { SetQueryDataForCommentPost } from '@/decorators/SetQueryDataForCommentPost.js';
import { SetQueryDataForDeletePost } from '@/decorators/SetQueryDataForDeletePost.js';
import { SetQueryDataForFollowProfile } from '@/decorators/SetQueryDataForFollowProfile.js';
import { SetQueryDataForLikePost } from '@/decorators/SetQueryDataForLikePost.js';
import { SetQueryDataForMirrorPost } from '@/decorators/SetQueryDataForMirrorPost.js';
import { SetQueryDataForPosts } from '@/decorators/SetQueryDataForPosts.js';
import { UndoRepostStatusToTwitterPosts } from '@/decorators/UndoRepostStatusToTwitterPosts.js';
import { WithMutedProfilesQuery } from '@/decorators/WithMutedProfilesQuery.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveTcoLink } from '@/helpers/resolveTcoLink.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { formatTweetsPage } from '@/providers/twitter/formatTwitterPost.js';
import { formatTwitterProfile, formatTwitterProfilePage } from '@/providers/twitter/formatTwitterProfile.js';
import { formatTwitterProfileFromRootdata } from '@/providers/twitter/formatTwitterProfileFromRootdata.js';
import { getTwitterProfileHandleFromUrl } from '@/providers/twitter/getTwitterProfileHandleFromUrl.js';
import { resolveTwitterReplyRestriction } from '@/providers/twitter/resolveTwitterReplyRestriction.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import {
    type NotificationSettings,
    TwitterUserInfoProfileImageShape,
    TwitterUserInfoVerifiedType,
} from '@/providers/types/Firefly.js';
import type { Session } from '@/providers/types/Session.js';
import {
    type Channel,
    type Friendship,
    type Notification,
    type Post,
    type Profile,
    type ProfileBadge,
    ProfileBadgePresetColors,
    type ProfileEditable,
    type Provider,
    SessionType,
} from '@/providers/types/SocialMedia.js';
import { useTwitterLikeStore } from '@/store/useTwitterLikeStore.js';
import { useTwitterRetweetStore } from '@/store/useTwitterRetweetStore.js';
import type { PartialWith, ResponseJson } from '@/types/utility.js';

export
@SetQueryDataForLikePost(Source.Twitter)
@SetQueryDataForBookmarkPost(Source.Twitter)
@SetQueryDataForMirrorPost(Source.Twitter)
@SetQueryDataForCommentPost(Source.Twitter)
@SetQueryDataForDeletePost(Source.Twitter)
@SetQueryDataForFollowProfile(Source.Twitter)
@SetQueryDataForBlockProfile(Source.Twitter)
@SetQueryDataForActPost(Source.Twitter)
@UndoRepostStatusToTwitterPosts()
@AddLikeStatusToTwitterPosts()
@SetQueryDataForPosts
@WithMutedProfilesQuery()
@AddAuthorHighlightStatusForPosts(Source.Twitter)
class OfficialSocialMedia implements Provider {
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

    getProfilesByAddress(address: string): Promise<Profile[]> {
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

    async getSuggestedFollows(
        indicator?: PageIndicator,
        _includeFollowingStatus?: boolean,
        locale?: Locale,
    ): Promise<Pageable<Profile, PageIndicator>> {
        const pageNo = indicator?.id ? Number.parseInt(indicator.id, 10) : 1;
        const res = await FireflyEndpointProvider.getTwitterTopPeople(indicator, locale);
        const data = res.items.map((x) => formatTwitterProfileFromRootdata(x));
        const nextIndicator = res.items ? createNextIndicator(indicator, `${pageNo + 1}`) : undefined;
        if (twitterSessionHolder.session) {
            const profiles = await OfficialSocialMediaProvider.getProfilesByIds(data.map((x) => x.profileId));
            return createPageable(
                data.map((x) => {
                    const profile = profiles.find(({ profileId }) => profileId === x.profileId);
                    return profile ? profile : x;
                }),
                createIndicator(indicator),
                nextIndicator,
            );
        }
        return createPageable(data, createIndicator(indicator), nextIndicator);
    }

    async discoverPostsById(
        profileId: string,
        indicator?: PageIndicator,
        signal?: AbortSignal,
    ): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(`/api/twitter/followingTimeline`, {
            limit: 25,
            cursor: indicator?.id,
            signal,
        });
        const response = await twitterSessionHolder.fetchWithSession<ResponseJson<TweetV2PaginableTimelineResult>>(url);
        const data = resolveTwitterResponseData(response);
        return formatTweetsPage(data, indicator);
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

    searchProfiles(q: string, indicator?: PageIndicator, limit = 25): Promise<Pageable<Profile, PageIndicator>> {
        return twitterSessionHolder.withSession(async (session) => {
            if (!session || !TWITTER_PROFILE_SEARCH_REGEXP.test(q))
                return createPageable([] as Profile[], createIndicator(indicator));
            const url = urlcat(`/api/twitter/user/search`, {
                limit,
                cursor: indicator?.id,
                query: q,
            });
            const response = await twitterSessionHolder.fetchWithSession<ResponseJson<UserV2TimelineResult>>(url);
            const data = resolveTwitterResponseData(response);
            return formatTwitterProfilePage(data, indicator);
        });
    }

    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
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

    async unmirrorPost(postId: string, authorId?: number | undefined): Promise<void> {
        const response = await twitterSessionHolder.fetch<ResponseJson<void>>(`/api/twitter/unretweet/${postId}`, {
            method: 'POST',
        });
        resolveTwitterResponseData(response);
        const session = twitterSessionHolder.session;
        if (session?.profileId) {
            useTwitterRetweetStore.getState().undoRepost(session.profileId, postId);
        }
    }

    async mirrorPost(postId: string): Promise<string> {
        const response = await twitterSessionHolder.fetch<ResponseJson<void>>(`/api/twitter/retweet/${postId}`, {
            method: 'POST',
        });
        const data = resolveTwitterResponseData(response);
        return postId;
    }

    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        const response = await twitterSessionHolder.fetch<ResponseJson<UserV2[]>>('/api/twitter/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ids,
            }),
        });
        const data = resolveTwitterResponseData(response);
        if (!data.length) return EMPTY_LIST;

        return data.map(formatTwitterProfile);
    }

    async follow(profileId: string): Promise<boolean> {
        const response = await twitterSessionHolder.fetch<ResponseJson<void>>(`/api/twitter/follow/${profileId}`, {
            method: 'POST',
        });
        const data = resolveTwitterResponseData(response);
        return true;
    }

    async unfollow(profileId: string): Promise<boolean> {
        const response = await twitterSessionHolder.fetch<ResponseJson<void>>(`/api/twitter/unfollow/${profileId}`, {
            method: 'POST',
        });
        const data = resolveTwitterResponseData(response);
        return true;
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getPostById(postId: string): Promise<Post> {
        const response = await twitterSessionHolder.fetch<ResponseJson<Post>>(`/api/twitter/${postId}`);
        const data = resolveTwitterResponseData(response);
        return data;
    }

    async getProfileById(profileId: string): Promise<Profile> {
        const response = await twitterSessionHolder.fetch<ResponseJson<UserV2>>(`/api/twitter/user/${profileId}`);
        const data = resolveTwitterResponseData(response);
        data.url = data.url && !isServer ? ((await resolveTcoLink(data.url)) ?? data.url) : data.url;
        return formatTwitterProfile(data);
    }

    async getProfileByHandle(handle: string): Promise<Profile> {
        const response = await twitterSessionHolder.fetch<ResponseJson<UserV2>>(`/api/twitter/username/${handle}`);
        const data = resolveTwitterResponseData(response);
        data.url = data.url && !isServer ? ((await resolveTcoLink(data.url)) ?? data.url) : data.url;
        return formatTwitterProfile(data);
    }

    async getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        if (isNumericalProfileId(profileIdOrHandle)) {
            // Using runInSafeAsync here to handle cases where a purely numerical handle might be passed
            const profile = await runInSafeAsync(() => this.getProfileById(profileIdOrHandle));
            if (profile) return profile;
        }
        return this.getProfileByHandle(profileIdOrHandle);
    }

    async getProfileBySession(session: Session): Promise<Profile> {
        const { profileId, payload } = session as TwitterSession;
        const response = await twitterSessionHolder.fetch<ResponseJson<UserV2>>(`/api/twitter/user/${profileId}`, {
            headers: TwitterSession.payloadToHeaders(payload),
        });
        const data = resolveTwitterResponseData(response);
        data.url = data.url && !isServer ? ((await resolveTcoLink(data.url)) ?? data.url) : data.url;
        return formatTwitterProfile(data);
    }

    getCollectedPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(`/api/twitter/userTimeline/${profileId}`, {
            limit: 25,
            cursor: indicator?.id,
        });
        const response = await twitterSessionHolder.fetchWithSession<ResponseJson<TweetV2PaginableTimelineResult>>(url);
        const data = resolveTwitterResponseData(response);
        return formatTweetsPage(data, indicator);
    }

    async getLikedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(`/api/twitter/userTimeline/${profileId}/liked`, {
            limit: 25,
            cursor: indicator?.id,
        });
        const response = await twitterSessionHolder.fetchWithSession<ResponseJson<TweetV2PaginableTimelineResult>>(url);
        const data = resolveTwitterResponseData(response);
        const postWithPageable = formatTweetsPage(data, indicator);
        return { ...postWithPageable, data: postWithPageable.data.map((post) => ({ ...post, hasLiked: true })) };
    }

    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(`/api/twitter/userTimeline/${profileId}/replies`, {
            limit: 25,
            cursor: indicator?.id,
        });
        const response = await twitterSessionHolder.fetchWithSession<ResponseJson<TweetV2PaginableTimelineResult>>(url);
        const data = resolveTwitterResponseData(response);
        return formatTweetsPage(data, indicator);
    }

    async getCommentsById(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(`/api/twitter/${postId}/comments`, {
            limit: 25,
            cursor: indicator?.id,
        });
        const response = await twitterSessionHolder.fetchWithSession<ResponseJson<TweetV2PaginableTimelineResult>>(url);
        const data = resolveTwitterResponseData(response);
        return formatTweetsPage(data, indicator);
    }

    async getThreadByPostId(postId: string): Promise<Post[]> {
        const response = await twitterSessionHolder.fetchWithSession<ResponseJson<Post[]>>(
            `/api/twitter/threadTweets/${postId}`,
        );
        const data = resolveTwitterResponseData(response);
        return data;
    }

    async upvotePost(postId: string): Promise<void> {
        const response = await twitterSessionHolder.fetch<ResponseJson<void>>(`/api/twitter/like/${postId}`, {
            method: 'POST',
        });
        const data = resolveTwitterResponseData(response);
        const session = twitterSessionHolder.session;
        if (session?.profileId) {
            useTwitterLikeStore.getState().like(session.profileId, postId);
        }
    }

    async unvotePost(postId: string): Promise<void> {
        const response = await twitterSessionHolder.fetch<ResponseJson<void>>(`/api/twitter/unlike/${postId}`, {
            method: 'POST',
        });
        const data = resolveTwitterResponseData(response);
        const session = twitterSessionHolder.session;
        if (session?.profileId) {
            useTwitterLikeStore.getState().unlike(session.profileId, postId);
        }
    }

    async searchPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return twitterSessionHolder.withSession(async (session) => {
            if (!session) return createPageable([] as Post[], createIndicator(indicator));
            const url = urlcat(`/api/twitter/search/all`, {
                limit: 25,
                cursor: indicator?.id,
                query: q,
            });
            const response = await twitterSessionHolder.fetchWithSession<ResponseJson<Tweetv2TimelineResult>>(url);
            const data = resolveTwitterResponseData(response);
            return formatTweetsPage(data, indicator);
        });
    }

    async quotePost(postId: string, post: Post): Promise<{ postId: string }> {
        const response = await twitterSessionHolder.fetch<
            ResponseJson<{
                id: string;
            }>
        >('/api/twitter/compose', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quoteTwitterId: post.parentPostId,
                replySettings: post.restrictions?.length
                    ? resolveTwitterReplyRestriction(post.restrictions[0])
                    : undefined,
                text: post.metadata.content?.content ?? '',
                mediaIds: compact(post.mediaObjects?.map((x) => x.id)),
            }),
        });

        const data = resolveTwitterResponseData(response, 'Failed to quote post.');
        return { postId: data.id };
    }

    async publishPost(
        post: Post,
        options: {
            excludeReplyProfileIds?: string[];
        } = {},
    ): Promise<{ postId: string }> {
        const response = await twitterSessionHolder.fetch<
            ResponseJson<{
                id: string;
            }>
        >('/api/twitter/compose', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...options,
                inReplyToTweetId: post.parentPostId,
                replySettings: post.restrictions?.length
                    ? resolveTwitterReplyRestriction(post.restrictions[0])
                    : undefined,
                text: post.metadata.content?.content ?? '',
                mediaIds: compact(post.mediaObjects?.map((x) => x.id)),
                poll: post.poll
                    ? {
                          options: post.poll.options.map((option) => ({ label: option.label })),
                          durationSeconds: post.poll.durationSeconds,
                      }
                    : undefined,
            }),
        });

        const data = resolveTwitterResponseData(response, 'Failed to publish post.');
        return { postId: data.id };
    }

    async deletePost(tweetId: string): Promise<boolean> {
        const response = await twitterSessionHolder.fetch<
            ResponseJson<{
                deleted: boolean;
            }>
        >(`/api/twitter/${tweetId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = resolveTwitterResponseData(response, 'Failed to publish post.');
        return data.deleted;
    }
    async blockProfile(profileId: string): Promise<boolean> {
        const response = await twitterSessionHolder.fetchWithSession<ResponseJson<UserV2MuteResult['data']>>(
            `/api/twitter/mute/${profileId}`,
            {
                method: 'POST',
            },
        );
        if (!response.success) throw new Error(response.error.message);

        await runInSafeAsync(() => FireflyEndpointProvider.blockProfileFor(FireflyPlatform.Twitter, profileId));
        return response.data?.muting === true;
    }
    async unblockProfile(profileId: string): Promise<boolean> {
        const response = await twitterSessionHolder.fetchWithSession<ResponseJson<UserV2MuteResult['data']>>(
            `/api/twitter/mute/${profileId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
        if (!response.success) throw new Error(response.error.message);

        await runInSafeAsync(() => FireflyEndpointProvider.unblockProfileFor(FireflyPlatform.Twitter, profileId));
        return response.data?.muting === false;
    }
    async getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return twitterSessionHolder.withSession(async (session) => {
            if (!session) return createPageable([], createIndicator(indicator));

            const url = urlcat('/api/twitter/mute', {
                limit: 20,
                cursor: indicator?.id,
            });
            const response =
                await twitterSessionHolder.fetchWithSession<ResponseJson<PartialWith<UserV2TimelineResult, 'data'>>>(
                    url,
                );
            if (!response.success) throw new Error(response.error.message);

            const profiles = response.data.data?.map(formatTwitterProfile) || EMPTY_LIST;
            return createPageable(
                profiles,
                createIndicator(indicator),
                response.data.meta.next_token ? createIndicator(undefined, response.data.meta.next_token) : undefined,
            );
        });
    }

    async bookmark(tweetId: string): Promise<boolean> {
        const response = await twitterSessionHolder.fetch<ResponseJson<boolean>>(`/api/twitter/bookmark/${tweetId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = resolveTwitterResponseData(response, 'Failed to bookmark post.');
        return data;
    }
    async unbookmark(tweetId: string): Promise<boolean> {
        const response = await twitterSessionHolder.fetch<ResponseJson<boolean>>(`/api/twitter/bookmark/${tweetId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = resolveTwitterResponseData(response, 'Failed to unbookmark post.');
        return data;
    }
    async getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat('/api/twitter/bookmarks', {
            cursor: indicator?.id || undefined,
            limit: 25,
        });
        const response = await twitterSessionHolder.fetch<ResponseJson<TweetV2PaginableTimelineResult>>(url);
        const data = resolveTwitterResponseData(response, 'Failed to fetch bookmarks.');
        return formatTweetsPage(data, indicator);
    }
    async reportProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }
    async reportPost(post: Post): Promise<boolean> {
        throw new NotImplementedError();
    }
    async uploadProfileAvatar(file: File) {
        const formData = new FormData();
        formData.set('file', file);
        const res = await twitterSessionHolder.fetch<ResponseJson<{ pfp: string }>>('/api/twitter/me/avatar', {
            method: 'PUT',
            body: formData,
        });
        if (!res.success) throw new Error('Failed to avatar.');
        return res.data.pfp;
    }
    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        const res = await twitterSessionHolder.fetch<ResponseJson<{}>>('/api/twitter/me', {
            method: 'PUT',
            body: JSON.stringify({
                name: profile.displayName,
                description: profile.bio,
                location: profile.location,
                url: profile.website,
            }),
        });
        if (!res.success) throw new Error(res.error.message);
        return true;
    }

    async getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        const response = await FireflyEndpointProvider.getTwitterUserInfo(profile.handle);
        const userInfo = response.data.user.result;
        if (!userInfo.is_blue_verified) return [];
        let color =
            userInfo.profile_image_shape === TwitterUserInfoProfileImageShape.Square
                ? ProfileBadgePresetColors.TwitterGold
                : ProfileBadgePresetColors.TwitterBlue;
        if (userInfo.legacy.verified_type === TwitterUserInfoVerifiedType.Government)
            color = ProfileBadgePresetColors.TwitterGray;
        const handle = userInfo.affiliates_highlighted_label.label
            ? getTwitterProfileHandleFromUrl(userInfo.affiliates_highlighted_label.label.url.url)
            : null;
        const href = handle ? getProfileUrl({ handle, source: Source.Twitter }) : undefined;
        return compact([
            {
                source: Source.Twitter,
                color,
            },
            userInfo.affiliates_highlighted_label.label?.badge.url
                ? {
                      source: Source.Twitter,
                      icon: userInfo.affiliates_highlighted_label.label.badge.url,
                      href,
                  }
                : null,
        ]);
    }

    async getSpace(id: string) {
        const response = await twitterSessionHolder.fetch<ResponseJson<SpaceV2SingleResult>>(
            urlcat('/api/twitter/space/:id', { id }),
        );
        const data = resolveTwitterResponseData(response, `Failed to fetch space "${id}".`);
        return data;
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    async getPinnedPost(profileId: string): Promise<Post | null> {
        const response = await twitterSessionHolder.fetch<ResponseJson<Post>>(`/api/twitter/user/${profileId}/pinned`);
        const data = resolveTwitterResponseData(response);
        return data;
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

export const OfficialSocialMediaProvider = new OfficialSocialMedia();
