import { compact, isEmpty } from 'lodash-es';
import urlcat from 'urlcat';

import { BookmarkType, FireflyPlatform, Source, SourceInURL } from '@/constants/enum.js';
import { NotFoundError, NotImplementedError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { SetQueryDataForBookmarkNFT } from '@/decorators/SetQueryDataForBookmarkNFT.js';
import { SetQueryDataForBookmarkToken } from '@/decorators/SetQueryDataForBookmarkToken.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { formatFireflyNotification } from '@/helpers/formatFireflyNotification.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import { isZero } from '@/helpers/number.js';
import { omitEmptyParams } from '@/helpers/omitEmptyParams.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSearchKeyword } from '@/helpers/resolveSearchKeyword.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { resolveTokenBookmarkId } from '@/helpers/resolveTokenBookmarkId.js';
import {
    formatBriefChannelFromFirefly,
    formatChannelFromFirefly,
    formatFireflyFarcasterProfile,
} from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import {
    formatFarcasterProfileFromFirefly,
    formatFarcasterProfileFromFireflyCache,
} from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import { getFarcasterFriendship } from '@/providers/farcaster/getFarcasterFriendship.js';
import { getFarcasterProfileById } from '@/providers/farcaster/getFarcasterProfileById.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { NeynarSocialMediaProvider } from '@/providers/neynar/SocialMedia.js';
import type { Account } from '@/providers/types/Account.js';
import type { BookmarkTokenOptions } from '@/providers/types/Bookmark.js';
import {
    type BlockChannelResponse,
    type BlockedChannelsResponse,
    type BlockedUsersResponse,
    type BookmarkResponse,
    type Cast,
    type CastResponse,
    type CastsOfChannelResponse,
    type CastsResponse,
    type ChannelResponse,
    type ChannelsResponse,
    type CommentsResponse,
    type DiscoverChannelsResponse,
    type FireflyFarcasterProfileResponse,
    type GetProfilesResponse,
    type MutualFollowersResponse,
    type NotificationResponse,
    type NotificationSettings,
    type PostQuotesResponse,
    type ReactorsResponse,
    type SearchCastsResponse,
    type SearchChannelsResponse,
    type SearchProfileResponse,
    type ThreadResponse,
    type User,
    type UsersResponse,
} from '@/providers/types/Firefly.js';
import type { Session } from '@/providers/types/Session.js';
import {
    type Channel,
    type Notification,
    type Post,
    type Profile,
    type ProfileBadge,
    type ProfileEditable,
    type ProfileForSignup,
    type Provider,
    SessionType,
} from '@/providers/types/SocialMedia.js';
import { getProfilesByIds } from '@/services/getProfilesByIds.js';
import { settings } from '@/settings/index.js';

/**
 * TODO: finish this if we have a way to query profile stats
 */
function ensureFollowersIsNotEmpty(users?: User[]) {
    if (!Array.isArray(users)) return [];
    return users.map(formatFarcasterProfileFromFirefly);
}

@SetQueryDataForBookmarkNFT()
@SetQueryDataForBookmarkToken()
class FireflySocialMedia implements Provider {
    get type() {
        return SessionType.Farcaster;
    }

    getChannelsByIds(ids: string[]): Promise<Channel[]> {
        throw new NotImplementedError();
    }

    reportChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getChannelById(channelId: string): Promise<Channel> {
        return FireflySocialMediaProvider.getChannelByHandle(channelId);
    }

    updateProfile(profile: ProfileEditable): Promise<boolean> {
        throw new NotImplementedError();
    }

    getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        throw new NotImplementedError();
    }

    quotePost(postId: string, post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    collectPost(postId: string, collectionId?: string): Promise<void> {
        throw new NotImplementedError();
    }

    async getProfilesByIds(ids: string[], sourceId?: string): Promise<Profile[]> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/farcasterinfo/list');
        const response = await fireflySessionHolder.fetch<GetProfilesResponse>(url, {
            method: 'POST',
            body: JSON.stringify({ fid: ids, sourceId: sourceId || null }),
        });
        const data = resolveFireflyResponseData(response);
        return data.map(formatFarcasterProfileFromFireflyCache);
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

    isFollowedByMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    isFollowingMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getSuggestedFollows(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    publishPost(post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    deletePost(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    upvotePost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    unvotePost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    commentPost(postId: string, post: Post): Promise<{ postId: string }> {
        throw new NotImplementedError();
    }

    mirrorPost(postId: string): Promise<string> {
        throw new NotImplementedError();
    }

    unmirrorPost(postId: string): Promise<void> {
        throw new NotImplementedError();
    }

    follow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unfollow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    blockProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unblockProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    actPost(postId: string, options: unknown): Promise<void> {
        throw new NotImplementedError();
    }

    async getChannelByHandle(channelHandle: string): Promise<Channel> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel_v2', {
            channelHandle,
        });
        const response = await fireflySessionHolder.fetch<ChannelResponse>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);
        if (!data.channel) {
            throw new NotFoundError(`Farcaster channel not found with handle=${channelHandle}.`);
        }
        return formatBriefChannelFromFirefly(data.channel, data.blocked);
    }

    async getChannelsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Channel, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/active_channels', {
            fid: profileId,
            size: indicator?.size,
        });
        const response = await fetchJson<ChannelsResponse>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);
        const channels = data.map(formatChannelFromFirefly);
        return createPageable(channels, createIndicator(indicator));
    }
    // no cursor in response
    async discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/trending_channels', {
            // XXX It' will response empty list if the size is equal to or greater than 25.
            size: 20,
            cursor: indicator?.id,
        });
        const response = await fireflySessionHolder.fetch<DiscoverChannelsResponse>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);
        const channels = data.map((x) => x.channel).map(formatChannelFromFirefly);
        return createPageable(channels, createIndicator(indicator), undefined);
    }

    getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return FireflySocialMediaProvider.getPostsByChannelHandle(channelId, indicator);
    }

    getPostsByChannelHandle(channelHandle: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel/casts', {
                channelHandle,
                fid: session?.profileId,
                size: 20,
                cursor: indicator?.id,
            });
            const response = await fireflySessionHolder.fetch<CastsOfChannelResponse>(url, {
                method: 'GET',
            });
            const data = resolveFireflyResponseData(response);
            const posts = data.casts.map((x) => formatFarcasterPostFromFirefly(x));

            return createPageable(
                posts,
                createIndicator(indicator),
                data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
            );
        });
    }

    async searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/channels', {
            keyword: q,
            size: 20,
            cursor: indicator?.id,
        });
        const response = await fetchJson<SearchChannelsResponse>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);
        const channels = data.channels.map((x) => formatBriefChannelFromFirefly(x));

        return createPageable(
            channels,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    }

    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const profile = getCurrentProfileFromStorage(Source.Farcaster);
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel/trending_casts', {
                channelUrl: channel.url,
                channelHandle: channel.id,
                size: 20,
                cursor: indicator?.id,
                fid: session?.profileId,
                handle: profile?.handle,
            });
            const response = await fireflySessionHolder.fetch<CastsOfChannelResponse>(url, {
                method: 'GET',
            });
            const data = resolveFireflyResponseData(response);
            const posts = data.casts.map((x) => formatFarcasterPostFromFirefly(x));

            return createPageable(
                posts,
                createIndicator(indicator),
                data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
            );
        });
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getProfileByHandle(handle: string): Promise<Profile> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/user/profile', {
                handle,
                sourceFid: session?.profileId,
            });
            const response = await fireflySessionHolder.fetch<FireflyFarcasterProfileResponse>(url);
            if (!response.data) throw new Error(`Farcaster profile not found handle=${handle}.`);
            return formatFireflyFarcasterProfile(response.data);
        });
    }

    getProfileBySession(session: Session): Promise<Profile> {
        throw new NotImplementedError();
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const query: Record<string, string | number | undefined> = {
                size: 20,
                sourceFid: session?.profileId,
                needRootParentHash: 1,
            };
            if (indicator?.id) query.cursor = indicator?.id;
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/farcaster/timeline', query);
            const response = await fireflySessionHolder.fetch<CastsResponse>(url);
            const data = resolveFireflyResponseData(response);
            const posts = data.casts.map((x) => formatFarcasterPostFromFirefly(x));

            return createPageable(
                posts,
                createIndicator(indicator),
                data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
            );
        });
    }

    async getPostById(postId: string): Promise<Post> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast', {
                hash: postId,
                fid: session?.profileId,
                needRootParentHash: true,
            });
            const { data: cast } = await fireflySessionHolder.fetch<CastResponse>(url, {
                method: 'GET',
            });

            const post = cast ? formatFarcasterPostFromFirefly(cast) : null;
            if (!post) throw new NotFoundError(`Farcaster post not found with postId=${postId}.`);
            return post;
        });
    }

    getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        if (isNumericalProfileId(profileIdOrHandle)) {
            return FireflySocialMediaProvider.getProfileById(profileIdOrHandle);
        }
        return FireflySocialMediaProvider.getProfileByHandle(profileIdOrHandle);
    }

    async getProfileById(profileId: string): Promise<Profile> {
        return farcasterSessionHolder.withSession(async (session) =>
            getFarcasterProfileById(profileId, session?.profileId),
        );
    }

    async getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/followers', {
                fid: profileId,
                size: 10,
                cursor: indicator?.id,
                sourceFid: session?.profileId,
            });
            const response = await fireflySessionHolder.fetch<UsersResponse>(url, {
                method: 'GET',
            });
            const { list, next_cursor } = resolveFireflyResponseData(response);

            return createPageable(
                ensureFollowersIsNotEmpty(list),
                createIndicator(indicator),
                next_cursor ? createNextIndicator(indicator, next_cursor) : undefined,
            );
        });
    }

    async getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/followings', {
                fid: profileId,
                size: 10,
                cursor: indicator?.id,
                sourceFid: session?.profileId,
            });
            const response = await fireflySessionHolder.fetch<UsersResponse>(url, {
                method: 'GET',
            });
            const { list, next_cursor } = resolveFireflyResponseData(response);

            return createPageable(
                ensureFollowersIsNotEmpty(list),
                createIndicator(indicator),
                next_cursor ? createNextIndicator(indicator, next_cursor) : undefined,
            );
        });
    }
    async getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const size = 20;
            const params = omitEmptyParams({
                fid: profileId,
                size,
                cursor: indicator?.id,
                sourceFid: session?.profileId,
            });
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/followersmutual', params);
            const response = await fireflySessionHolder.fetch<MutualFollowersResponse>(url, {
                method: 'GET',
            });

            const { list, total } = resolveFireflyResponseData(response);
            const currentCursor = Number.parseInt(params.cursor || '0', 10);
            const next_cursor = total > currentCursor + size ? currentCursor + size : undefined;

            return createPageable(
                ensureFollowersIsNotEmpty(list),
                createIndicator(indicator),
                next_cursor ? createNextIndicator(indicator, `${next_cursor}`) : undefined,
                total,
            );
        });
    }

    async getCommentsById(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/comments', {
                hash: postId,
                size: 25,
                fid: session?.profileId,
                cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                priority: 'high',
            });
            const response = await fireflySessionHolder.fetch<CommentsResponse>(url, {
                method: 'GET',
            });
            const { comments, cursor } = resolveFireflyResponseData(response);
            const posts = comments.map((item) => formatFarcasterPostFromFirefly(item));

            return createPageable(
                posts,
                createIndicator(indicator),
                cursor ? createNextIndicator(indicator, cursor) : undefined,
            );
        });
    }

    async getHiddenComments(postId: string, indicator?: PageIndicator) {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/comments', {
                hash: postId,
                size: 25,
                fid: session?.profileId,
                cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                priority: 'low',
            });
            const response = await fireflySessionHolder.fetch<CommentsResponse>(url, {
                method: 'GET',
            });
            const { comments, cursor } = resolveFireflyResponseData(response);
            const posts = comments.map((item) => formatFarcasterPostFromFirefly(item));

            return createPageable(
                posts,
                createIndicator(indicator),
                cursor ? createNextIndicator(indicator, cursor) : undefined,
            );
        });
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator) {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/user/timeline/farcaster/casts');
            const response = await fireflySessionHolder.fetch<CastsResponse>(url, {
                method: 'POST',
                body: JSON.stringify({
                    fids: [profileId],
                    size: 25,
                    sourceFid: session?.profileId,
                    cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                }),
            });
            const { casts, cursor } = resolveFireflyResponseData(response);
            const posts = casts.map((cast) => formatFarcasterPostFromFirefly(cast));

            return createPageable(
                posts,
                createIndicator(indicator),
                cursor ? createNextIndicator(indicator, cursor) : undefined,
            );
        });
    }

    async getCollectedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getLikedPostsByProfileId(profileId: string, indicator?: PageIndicator) {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/user/timeline/farcaster/likes');
            const response = await fireflySessionHolder.fetch<CastsResponse>(url, {
                method: 'POST',
                body: JSON.stringify({
                    fids: [profileId],
                    size: 25,
                    sourceFid: session?.profileId,
                    cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                }),
            });
            const { casts, cursor } = resolveFireflyResponseData(response);
            const posts = casts.map((cast) => formatFarcasterPostFromFirefly(cast));

            return createPageable(
                posts,
                createIndicator(indicator),
                cursor ? createNextIndicator(indicator, cursor) : undefined,
            );
        });
    }

    async getRepliesPostsByProfileId(profileId: string, indicator?: PageIndicator) {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/user/timeline/farcaster');

            const response = await fireflySessionHolder.fetch<CastsResponse>(url, {
                method: 'POST',
                body: JSON.stringify({
                    fids: [profileId],
                    size: 25,
                    sourceFid: session?.profileId,
                    cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                    needRootParentHash: true,
                }),
            });

            const { casts, cursor } = resolveFireflyResponseData(response);
            const posts = casts.map((cast) => formatFarcasterPostFromFirefly(cast));

            return createPageable(
                posts,
                createIndicator(indicator),
                cursor ? createNextIndicator(indicator, cursor) : undefined,
            );
        });
    }

    async getNotifications(indicator?: PageIndicator): Promise<Pageable<Notification, PageIndicator>> {
        const profileId = farcasterSessionHolder.sessionRequired.profileId;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/notifications/new', {
            fid: profileId,
            sourceFid: profileId,
            cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
        });
        const response = await fireflySessionHolder.fetch<NotificationResponse>(url, { method: 'GET' });
        const data = resolveFireflyResponseData(response);
        const notifications = compact(data.notifications.map((x) => formatFireflyNotification(profileId, x)));

        return createPageable(
            notifications,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        throw new NotImplementedError();
    }

    async setNotificationSettings(settings: NotificationSettings): Promise<boolean> {
        throw new NotImplementedError();
    }

    async discoverPostsById(
        profileId: string,
        indicator?: PageIndicator,
        signal?: AbortSignal,
    ): Promise<Pageable<Post, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/timeline/farcaster');
            const response = await fireflySessionHolder.fetch<CastsResponse>(url, {
                method: 'POST',
                body: JSON.stringify({
                    size: 25,
                    needRootParentHash: true,
                    sourceFid: profileId,
                    cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                }),
                signal,
            });
            const { casts, cursor } = resolveFireflyResponseData(response);
            const posts = casts.map((x) => formatFarcasterPostFromFirefly(x));

            return createPageable(
                posts,
                createIndicator(indicator),
                cursor ? createNextIndicator(indicator, cursor) : undefined,
            );
        }, true);
    }

    async getLikeReactors(postId: string, indicator?: PageIndicator) {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/likes', {
                castHash: postId,
                size: 15,
                sourceFid: session?.profileId,
                cursor: indicator?.id,
            });
            const response = await fireflySessionHolder.fetch<ReactorsResponse>(url, {
                method: 'GET',
            });
            const { items, nextCursor } = resolveFireflyResponseData(response);

            return createPageable(
                ensureFollowersIsNotEmpty(items),
                createIndicator(indicator),
                nextCursor ? createNextIndicator(indicator, nextCursor) : undefined,
            );
        });
    }

    async getRepostReactors(postId: string, indicator?: PageIndicator) {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/recasters', {
                castHash: postId,
                size: 15,
                sourceFid: session?.profileId,
                cursor: indicator?.id,
            });
            const response = await fireflySessionHolder.fetch<ReactorsResponse>(url, {
                method: 'GET',
            });
            const { items, nextCursor } = resolveFireflyResponseData(response);

            return createPageable(
                ensureFollowersIsNotEmpty(items),
                createIndicator(indicator),
                nextCursor ? createNextIndicator(indicator, nextCursor) : undefined,
            );
        });
    }

    // TODO: now for farcaster only, support other platforms in the future.
    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/identity', {
            keyword: q,
            size: 25,
            cursor: indicator?.id,
        });
        const response = await fireflySessionHolder.fetch<SearchProfileResponse>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);
        const fids = compact((data.list || []).flatMap((x) => x.farcaster).map((x) => x?.platform_id));
        const result = await FireflySocialMediaProvider.getProfilesByIds(fids);

        return createPageable(
            result,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    }

    async searchPosts(
        q: string,
        indicator?: PageIndicator,
        fullMatch?: boolean,
    ): Promise<Pageable<Post, PageIndicator>> {
        const { handle, content } = resolveSearchKeyword(q);
        return farcasterSessionHolder.withSession(async (session) => {
            const page = indicator?.id || '1';
            const url = urlcat(
                settings.FIREFLY_ROOT_URL,
                fullMatch ? '/v2/farcaster-hub/cast/searchfull' : '/v2/farcaster-hub/cast/search',
                {
                    keyword: content,
                    fidHandle: handle,
                    limit: 25,
                    sourceFid: session?.profileId,
                    page,
                },
            );
            const response = await fireflySessionHolder.fetch<SearchCastsResponse>(url);
            const data = resolveFireflyResponseData(response);
            const casts = Array.isArray(data) ? data : data.casts;
            const posts = casts.map((cast) => formatFarcasterPostFromFirefly(cast));
            return createPageable(
                posts,
                createIndicator(indicator),
                !Array.isArray(data) && casts.length === 25
                    ? createNextIndicator(indicator, `${+page + 1}`)
                    : undefined,
            );
        });
    }

    async getFriendship(profileId: string) {
        return farcasterSessionHolder.withSession((session) =>
            session ? getFarcasterFriendship(session.profileId, profileId) : null,
        );
    }

    async getThreadByPostId(postId: string, localPost?: Post) {
        return farcasterSessionHolder.withSession(async (session) => {
            const post = localPost ?? (await FireflySocialMediaProvider.getPostById(postId));

            const response = await fireflySessionHolder.fetch<ThreadResponse>(
                urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/threads', {
                    sourceFid: session?.profileId,
                    hash: postId,
                    maxDepth: 25,
                }),
                {
                    method: 'GET',
                },
            );
            const data = resolveFireflyResponseData(response);
            const posts = data.threads.map((x) => formatFarcasterPostFromFirefly(x));
            return [post, ...posts];
        });
    }

    async getBlockedProfiles(
        indicator?: PageIndicator,
        source?: Exclude<SourceInURL, SourceInURL.Article>,
    ): Promise<Pageable<Profile, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/platformMuteList', {
            size: 20,
            page: indicator?.id ?? 1,
            platform: source,
        });
        const response = await fireflySessionHolder.fetch<BlockedUsersResponse>(url);
        const ids = response.data?.blocks.map((x) => x.snsId);
        const profiles: Profile[] = ids?.length && source ? await getProfilesByIds(source, ids) : EMPTY_LIST;

        const blockedProfiles: Profile[] = profiles.map((profile) => ({
            ...profile,
            // since we use our own mute system, we need to set blocking to true manually
            viewerContext: { ...profile.viewerContext, blocking: true },
        }));

        return createPageable(
            blockedProfiles,
            createIndicator(indicator),
            response.data?.nextPage ? createNextIndicator(indicator, `${response.data?.nextPage}`) : undefined,
        );
    }

    async getBlockedChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            if (!session) {
                throw new Error('No farcaster session found');
            }

            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel/blocks', {
                account_id: session.profileId,
            });
            const response = await fireflySessionHolder.fetch<BlockedChannelsResponse>(url);
            const channelIds = response.data?.blocks.map((x) => x.channel_id);
            const channels = channelIds?.length
                ? await NeynarSocialMediaProvider.getChannelsByIds(channelIds)
                : EMPTY_LIST;
            return createPageable(channels, createIndicator(indicator), undefined);
        });
    }

    async getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/quotes', {
            hash: postId,
            size: 20,
            cursor: indicator?.id,
            needRootParentHash: true,
        });
        const response = await fireflySessionHolder.fetch<PostQuotesResponse>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);
        const posts = data.quotes.map((x) => formatFarcasterPostFromFirefly(x));

        return createPageable(
            posts,
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
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/create');
        const response = await fireflySessionHolder.fetch<string>(url, {
            method: 'POST',
            body: JSON.stringify({
                platform: (platform === FireflyPlatform.NFTs ? 'nft' : platform) ?? FireflyPlatform.Farcaster,
                platform_id: profileId,
                post_type: postType,
                post_id: postId,
            }),
        });
        if (response) return true;
        throw new Error('Failed to bookmark.');
    }

    async unbookmark(postId: string): Promise<boolean> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/remove');
        const response = await fireflySessionHolder.fetch<string>(url, {
            method: 'POST',
            body: JSON.stringify({
                post_ids: [postId],
            }),
        });
        if (response) return true;
        throw new Error('Failed to remove bookmark.');
    }

    async getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/find', {
                post_type: BookmarkType.All,
                platforms: FireflyPlatform.Farcaster,
                limit: 25,
                cursor: indicator?.id || undefined,
                fid: session?.profileId,
            });
            const response = await fireflySessionHolder.fetch<BookmarkResponse<Cast>>(url);

            const posts = compact(
                response.data?.list.map((x) => {
                    if (!x.post_content || isEmpty(x.post_content)) return null;
                    const formatted = formatFarcasterPostFromFirefly(x.post_content);
                    if (!formatted) return null;
                    return {
                        ...formatted,
                        hasBookmarked: true,
                    };
                }) || [],
            );

            return createPageable(
                posts,
                createIndicator(indicator),
                response.data?.cursor ? createNextIndicator(indicator, `${response.data.cursor}`) : undefined,
            );
        });
    }

    async blockChannel(channelId: string): Promise<boolean> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel/block');
        const response = await fireflySessionHolder.fetch<BlockChannelResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                channel_id: channelId,
            }),
        });

        if (response) return true;
        throw new Error('Failed to mute channel');
    }

    async unblockChannel(channelId: string): Promise<boolean> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel/block');
        const response = await fireflySessionHolder.fetch<BlockChannelResponse>(url, {
            method: 'DELETE',
            body: JSON.stringify({
                channel_id: channelId,
            }),
        });

        if (response) return true;
        throw new Error('Failed to mute channel');
    }

    async reportPost(post: Post): Promise<boolean> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/report/post/create');
        await fireflySessionHolder.fetch<string>(url, {
            method: 'POST',
            body: JSON.stringify({
                platform: resolveSourceInUrlForApi(post.source),
                platform_id: post.author.profileId,
                post_type: 'text',
                post_id: post.postId,
            }),
        });
        return true;
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    async getPinnedPost(profileId: string): Promise<Post | null> {
        throw new NotImplementedError();
    }

    async bookmarkNFT(nftId: string, owner?: string): Promise<boolean> {
        return FireflySocialMediaProvider.bookmark(nftId, FireflyPlatform.NFTs, owner, BookmarkType.All);
    }

    async unbookmarkNFT(nftId: string, owner?: string): Promise<boolean> {
        return FireflySocialMediaProvider.unbookmark(nftId);
    }

    async bookmarkToken(options: BookmarkTokenOptions) {
        const bookmarkContentId = resolveTokenBookmarkId(options);
        return FireflySocialMediaProvider.bookmark(
            bookmarkContentId,
            FireflyPlatform.Token,
            undefined,
            BookmarkType.All,
        );
    }
    async unbookmarkToken(options: BookmarkTokenOptions) {
        const bookmarkContentId = resolveTokenBookmarkId(options);
        return FireflySocialMediaProvider.unbookmark(bookmarkContentId);
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
        throw new NotImplementedError();
    }
}

export { FireflySocialMedia };
export const FireflySocialMediaProvider = new FireflySocialMedia();
