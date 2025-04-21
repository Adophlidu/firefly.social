import {
    AccountReportReason,
    AccountsOrderBy,
    evmAddress,
    GroupsOrderBy,
    MainContentFocus,
    ManagedAccountsVisibility,
    PageSize,
    postId as toPostId,
    PostReactionType,
    PostReferenceType,
    PostReportReason,
    PostType,
    PostVisibilityFilter,
    ReferenceRelevancyFilter,
} from '@lens-protocol/client';
import {
    addReaction,
    bookmarkPost,
    deletePost,
    executePostAction,
    fetchAccount,
    fetchAccountRecommendations,
    fetchAccounts,
    fetchAccountsAvailable,
    fetchAccountsBulk,
    fetchFollowers,
    fetchFollowersYouKnow,
    fetchFollowing,
    fetchFollowStatus,
    fetchGroupMembers,
    fetchGroups,
    fetchGroupStats,
    fetchNotifications,
    fetchPost,
    fetchPostBookmarks,
    fetchPostReactions,
    fetchPostReferences,
    fetchPosts,
    fetchPostsToExplore,
    fetchWhoReferencedPost,
    follow,
    joinGroup as joinLensGroup,
    leaveGroup as leaveLensGroup,
    muteAccount,
    post,
    reportAccount,
    reportPost,
    repost,
    setAccountMetadata,
    undoBookmarkPost,
    undoReaction,
    unfollow,
    unmuteAccount,
} from '@lens-protocol/client/actions';
import { account, type MetadataAttribute, MetadataAttributeType } from '@lens-protocol/metadata';
import { unreachable } from '@masknet/kit';
import { isServer } from '@tanstack/react-query';
import { compact, first, flatMap, uniqWith } from 'lodash-es';
import urlcat from 'urlcat';
import { v4 as uuid } from 'uuid';

import { FireflyPlatform, Source, SourceInURL } from '@/constants/enum.js';
import { InvalidResultError, NotImplementedError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { SetQueryDataForActPost } from '@/decorators/SetQueryDataForActPost.js';
import { SetQueryDataForApprovalLensModule } from '@/decorators/SetQueryDataForApprovalLensModule.js';
import { SetQueryDataForBlockProfile } from '@/decorators/SetQueryDataForBlockProfile.js';
import { SetQueryDataForBookmarkPost } from '@/decorators/SetQueryDataForBookmarkPost.js';
import { SetQueryDataForCommentPost } from '@/decorators/SetQueryDataForCommentPost.js';
import { SetQueryDataForDeletePost } from '@/decorators/SetQueryDataForDeletePost.js';
import {
    SetQueryDataForFollowProfile,
    SetQueryDataForSuperFollowProfile,
} from '@/decorators/SetQueryDataForFollowProfile.js';
import { SetQueryDataForJoinChannel } from '@/decorators/SetQueryDataForJoinChannel.js';
import { SetQueryDataForLikePost } from '@/decorators/SetQueryDataForLikePost.js';
import { SetQueryDataForMirrorPost } from '@/decorators/SetQueryDataForMirrorPost.js';
import { SetQueryDataForPosts } from '@/decorators/SetQueryDataForPosts.js';
import { ensureLensResult, ensurePostToLensResult } from '@/helpers/ensureLensResult.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import {
    filterFeedsV3,
    formatLensPostByFeedV3,
    formatLensPostV3,
    formatLensQuoteOrCommentV3,
} from '@/helpers/formatLensPost.js';
import { formatLensPostRules } from '@/helpers/formatLensPostRules.js';
import { formatLensProfileV3 } from '@/helpers/formatLensProfile.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { getLensProfileBySession } from '@/helpers/getLensProfileBySession.js';
import { handleOperationWithLensChain } from '@/helpers/handleOperationWithLensChain.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { retry } from '@/helpers/retry.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { filterNotifications } from '@/providers/lens/filterNotifications.js';
import {
    isAccountActionExecutedNotification,
    isCommentNotification,
    isFollowNotification,
    isGroupMembershipRequestApprovedNotification,
    isGroupMembershipRequestRejectedNotification,
    isMentionNotification,
    isPostActionExecutedNotification,
    isQuoteNotification,
    isReactionNotification,
    isRepostNotification,
} from '@/providers/lens/isNotification.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
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
    NotificationType,
    type Post,
    type Profile,
    type ProfileBadge,
    type ProfileEditable,
    type Provider,
    ReactionType,
    SessionType,
} from '@/providers/types/SocialMedia.js';
import { fetchProfileTimeline } from '@/services/lensV3/fetchProfileTimeline.js';
import { getAccountWithStatsByHandle, getAccountWithStatsById } from '@/services/lensV3/getAccountWithStats.js';
import { getGroupWithMemberCount, getGroupWithOwner } from '@/services/lensV3/getFullGroup.js';
import { uploadLensMetadataToS3 } from '@/services/uploadLensMetadataToS3.js';
import type { ResponseJSON } from '@/types/index.js';
import { formatLensChannelFromGroup } from '#src/helpers/formatLensChannel.js';

function getClient() {
    if (isServer) return lensSessionHolder.sdk;

    const profile = getCurrentProfile(Source.Lens);
    if (!profile) return lensSessionHolder.sdk;

    try {
        return lensSessionHolder.sessionClient;
    } catch {
        return lensSessionHolder.sdk;
    }
}

@SetQueryDataForLikePost(Source.Lens)
@SetQueryDataForBookmarkPost(Source.Lens)
@SetQueryDataForMirrorPost(Source.Lens)
@SetQueryDataForCommentPost(Source.Lens)
@SetQueryDataForDeletePost(Source.Lens)
@SetQueryDataForBlockProfile(Source.Lens)
@SetQueryDataForFollowProfile(Source.Lens)
@SetQueryDataForSuperFollowProfile(Source.Lens)
@SetQueryDataForActPost(Source.Lens)
@SetQueryDataForPosts
@SetQueryDataForApprovalLensModule
@SetQueryDataForJoinChannel(Source.Lens)
export class LensSocialMedia implements Provider {
    get type() {
        return SessionType.Lens;
    }

    getFriendship(profileId: string): Promise<Friendship | null> {
        throw new NotImplementedError();
    }

    async getChannelById(channelId: string, includeFollowingStatus?: boolean, ownerId?: string): Promise<Channel> {
        if (ownerId) {
            return getGroupWithOwner(channelId, ownerId);
        }
        const group = await getGroupWithMemberCount(channelId);
        const owner = group.ownerId
            ? await runInSafeAsync(() => LensSocialMediaProvider.getProfileById(group.ownerId!))
            : undefined;

        return { ...group, lead: owner };
    }

    async getChannelsByIds(ids: string[]): Promise<Channel[]> {
        return Promise.all(ids.map((id) => this.getChannelById(id)));
    }

    getChannelByHandle(channelHandle: string): Promise<Channel> {
        throw new NotImplementedError();
    }

    async getChannelsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Channel, PageIndicator>> {
        const result = await ensureLensResult(
            fetchGroups(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                orderBy: GroupsOrderBy.Alphabetical,
                filter: {
                    member: evmAddress(profileId),
                },
            }),
        );
        const channels = compact(result.items.map((x) => (x.feed ? formatLensChannelFromGroup(x) : null)));

        return createPageable(
            channels,
            createIndicator(indicator),
            result?.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    feeds: [{ feed: evmAddress(channelId) }],
                    metadata: null,
                },
            }),
        );

        return createPageable(
            await Promise.all(filterFeedsV3(compact(result.items)).map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    getPostsByChannelHandle(channelHandle: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        const result = await ensureLensResult(
            fetchGroups(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                orderBy: GroupsOrderBy.LatestFirst,
                filter: {
                    searchQuery: q || undefined,
                },
            }),
        );

        const ownerIds = result.items.map((x) => x.owner);
        const owners = await runInSafeAsync(() => LensSocialMediaProvider.getProfilesByIds(ownerIds));

        return createPageable(
            (result?.items.map(formatLensChannelFromGroup) ?? EMPTY_LIST).map((x) => ({
                ...x,
                lead: owners?.find((profile) => isSameEthereumAddress(profile.profileId, x.ownerId)),
            })),
            createIndicator(indicator),
            result?.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const result = await ensureLensResult(
            fetchGroupMembers(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                group: evmAddress(channelId),
            }),
        );

        return createPageable(
            result.items.map((x) => formatLensProfileV3(x.account)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getLikedPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getReactors(postId: string): Promise<Pageable<Profile>> {
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
        const result = await ensureLensResult(deletePost(lensSessionHolder.sessionClient, { post: postId }));
        await handleOperationWithLensChain(result);
        return true;
    }

    async publishPost(draftPost: Post): Promise<{ postId: string }> {
        if (!draftPost.metadata.contentURI) throw new Error('No content to publish.');

        return ensurePostToLensResult(
            post(lensSessionHolder.sessionClient, {
                contentUri: draftPost.metadata.contentURI,
                rules: formatLensPostRules(draftPost.restrictions),
                feed: draftPost.channel?.feedId ? evmAddress(draftPost.channel.feedId) : undefined,
            }),
        );
    }

    async mirrorPost(postId: string): Promise<string> {
        const result = await ensurePostToLensResult(
            repost(lensSessionHolder.sessionClient, {
                post: postId,
            }),
            false,
        );

        return result.postId;
    }

    async unmirrorPost(postId: string): Promise<void> {
        await this.deletePost(postId);
    }

    // intro is the contentURI of the post
    async quotePost(postId: string, draftPost: Post, signless?: boolean): Promise<{ postId: string }> {
        const intro = draftPost.metadata.content?.content ?? '';
        return ensurePostToLensResult(
            post(lensSessionHolder.sessionClient, {
                contentUri: intro,
                quoteOf: { post: postId },
                rules: formatLensPostRules(draftPost.restrictions),
            }),
        );
    }

    async collectPost(postId: string): Promise<void> {
        await ensureLensResult(bookmarkPost(lensSessionHolder.sessionClient, { post: postId }));
    }

    async actPost(postId: string) {
        const result = await ensureLensResult(
            executePostAction(lensSessionHolder.sessionClient, {
                post: toPostId(postId),
                action: {
                    simpleCollect: { selected: true },
                },
            }),
        );
        await handleOperationWithLensChain(result);
    }

    // comment is the contentURI of the post
    async commentPost(postId: string, draftPost: Post, signless?: boolean): Promise<{ postId: string }> {
        const comment = draftPost.metadata.content?.content ?? '';
        return ensurePostToLensResult(
            post(lensSessionHolder.sessionClient, {
                contentUri: comment,
                commentOn: { post: postId },
            }),
        );
    }

    async upvotePost(postId: string) {
        const result = await ensureLensResult(
            addReaction(lensSessionHolder.sessionClient, { post: postId, reaction: PostReactionType.Upvote }),
        );
        switch (result.__typename) {
            case 'AddReactionResponse':
                if (!result.success) {
                    throw new Error(`Failed to upvote`);
                }
                break;
            case 'AddReactionFailure':
                throw new Error(`Failed to upvote`);
            default:
                unreachable(result);
        }
    }

    async unvotePost(postId: string): Promise<void> {
        const result = await ensureLensResult(
            undoReaction(lensSessionHolder.sessionClient, { post: postId, reaction: PostReactionType.Downvote }),
        );
        switch (result.__typename) {
            case 'UndoReactionResponse':
                if (!result.success) {
                    throw new Error(`Failed to unvote`);
                }
                break;
            case 'UndoReactionFailure':
                throw new Error(`Failed to unvote`);
            default:
                unreachable(result);
        }
    }

    async getProfilesByAddress(address: string): Promise<Profile[]> {
        // TODO: lastLoggedInAccount
        const profiles = await ensureLensResult(
            fetchAccountsAvailable(lensSessionHolder.sdk, {
                managedBy: evmAddress(address),
                pageSize: PageSize.Fifty,
                includeOwned: true,
                hiddenFilter: ManagedAccountsVisibility.All,
            }),
        );
        return profiles.items.map((x) => ({
            ...formatLensProfileV3(x.account),
            profileType: x.__typename,
        }));
    }

    async getProfileById(profileId: string, includeGraphStats?: boolean): Promise<Profile> {
        if (includeGraphStats) {
            return getAccountWithStatsById(profileId);
        }
        const result = await ensureLensResult(fetchAccount(getClient(), { address: evmAddress(profileId) }));
        if (!result) throw new Error('No profile found');

        return formatLensProfileV3(result);
    }

    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        if (!ids.length) return [];
        const result = await ensureLensResult(
            fetchAccountsBulk(getClient(), {
                addresses: ids.map(evmAddress),
            }),
        );
        const profiles = result.map(formatLensProfileV3);

        return profiles;
    }

    async getProfileByHandle(handle: string, includeGraphStats?: boolean): Promise<Profile> {
        if (includeGraphStats) {
            return getAccountWithStatsByHandle(handle);
        }
        const result = await ensureLensResult(fetchAccount(getClient(), { username: { localName: handle } }));
        if (!result) throw new Error('No profile found');

        return formatLensProfileV3(result);
    }

    async getProfileBySession(session: Session): Promise<Profile> {
        return getLensProfileBySession(session as LensSession);
    }

    async getProfileByIdOrHandle(profileIdOrHandle: string, includeGraphStats?: boolean): Promise<Profile> {
        if (isValidAddressEthereum(profileIdOrHandle)) return this.getProfileById(profileIdOrHandle, includeGraphStats);
        return this.getProfileByHandle(profileIdOrHandle, includeGraphStats);
    }

    async getPostById(postId: string): Promise<Post> {
        const result = await ensureLensResult(fetchPost(getClient(), { post: postId }));
        if (!result) throw new Error('No post found');

        return formatLensPostV3(result);
    }

    async getPostByTxHashWithPolling(txHash: string): Promise<Post> {
        const getPostByTxHash = async (txHash: string): Promise<Post> => {
            const result = await ensureLensResult(fetchPost(getClient(), { txHash }));
            if (!result) {
                throw new InvalidResultError();
            }

            return formatLensPostV3(result);
        };
        return retry(() => getPostByTxHash(txHash));
    }

    async getCommentsById(
        postId: string,
        indicator?: PageIndicator,
        hasFilter = true,
    ): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPostReferences(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                referencedPost: postId,
                referenceTypes: [PostReferenceType.CommentOn],
                relevancyFilter: hasFilter ? ReferenceRelevancyFilter.Relevant : ReferenceRelevancyFilter.All,
                visibilityFilter: hasFilter ? PostVisibilityFilter.Visible : PostVisibilityFilter.All,
            }),
        );

        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getCommentsByProfileId(postId: string, profileId: string, indicator?: PageIndicator) {
        const result = await ensureLensResult(
            fetchPostReferences(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                referencedPost: postId,
                referenceTypes: [PostReferenceType.CommentOn],
            }),
        );

        if (!result) throw new Error('No comments found');

        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPostsToExplore(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
            }),
        );

        if (!result) {
            return createPageable([], createIndicator(indicator));
        }

        return createPageable(
            await Promise.all(filterFeedsV3(compact(result.items)).map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async discoverPostsById(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        return fetchProfileTimeline(profileId, indicator);
    }

    async getCollectedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    collectedBy: {
                        account: evmAddress(profileId),
                    },
                },
            }),
        );

        return createPageable(
            uniqWith(await Promise.all(result.items.map(formatLensPostV3)), isSamePost),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    authors: [evmAddress(profileId)],
                    postTypes: [PostType.Root, PostType.Repost, PostType.Quote],
                },
            }),
        );

        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    authors: [evmAddress(profileId)],
                    postTypes: [PostType.Comment],
                },
            }),
        );

        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getMediaPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    authors: [evmAddress(profileId)],
                    metadata: {
                        mainContentFocus: [MainContentFocus.Image, MainContentFocus.Audio, MainContentFocus.Video],
                    },
                    postTypes: [PostType.Root, PostType.Repost, PostType.Quote, PostType.Comment],
                },
            }),
        );

        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    // TODO: Invalid
    async getPostsBeMentioned(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        const result = await ensureLensResult(
            fetchPosts(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    authors: [evmAddress(profileId)],
                },
            }),
        );

        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getPostsLiked(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    async getPostsReplies(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        const result = await ensureLensResult(
            fetchPosts(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    authors: [evmAddress(profileId)],
                    postTypes: [PostType.Comment],
                },
            }),
        );

        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getPostsByParentPostId(postId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        const result = await ensureLensResult(
            fetchPostReferences(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                referencedPost: postId,
                referenceTypes: [PostReferenceType.CommentOn],
            }),
        );

        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async follow(profileId: string): Promise<boolean> {
        const result = await ensureLensResult(
            follow(lensSessionHolder.sessionClient, { account: evmAddress(profileId) }),
        );
        await handleOperationWithLensChain(result);
        return true;
    }

    async superFollow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async unfollow(profileId: string): Promise<boolean> {
        const result = await ensureLensResult(
            unfollow(lensSessionHolder.sessionClient, { account: evmAddress(profileId) }),
        );
        await handleOperationWithLensChain(result);
        return true;
    }

    async getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        const result = await ensureLensResult(
            fetchFollowers(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                account: evmAddress(profileId),
            }),
        );

        return createPageable(
            result.items.map((x) => formatLensProfileV3(x.follower)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        const result = await ensureLensResult(
            fetchFollowing(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                account: evmAddress(profileId),
            }),
        );

        return createPageable(
            result.items.map((x) => formatLensProfileV3(x.following)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }
    async getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const profile = getCurrentProfile(Source.Lens);

        if (!profile?.profileId || isSameEthereumAddress(profile.profileId, profileId))
            return createPageable([], createIndicator(indicator));

        const result = await ensureLensResult(
            fetchFollowersYouKnow(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                observer: profile.profileId,
                target: evmAddress(profileId),
            }),
        );

        return createPageable(
            result.items.map((x) => formatLensProfileV3(x.follower)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async isFollowedByMe(profileId: string): Promise<boolean> {
        const profile = getCurrentProfile(Source.Lens);
        if (!profile) return false;

        const result = await ensureLensResult(
            fetchFollowStatus(getClient(), {
                pairs: [
                    {
                        account: evmAddress(profileId),
                        follower: evmAddress(profile.profileId),
                    },
                ],
            }),
        );

        return first(result)?.isFollowing.onChain ?? false;
    }

    async isFollowingMe(profileId: string): Promise<boolean> {
        const profile = getCurrentProfile(Source.Lens);
        if (!profile) return false;

        const result = await ensureLensResult(
            fetchFollowStatus(getClient(), {
                pairs: [
                    {
                        account: evmAddress(profile.profileId),
                        follower: evmAddress(profileId),
                    },
                ],
            }),
        );

        return first(result)?.isFollowing.onChain ?? false;
    }

    async getNotifications(
        indicator?: PageIndicator,
        highSignalFilter?: boolean,
    ): Promise<Pageable<Notification, PageIndicator>> {
        const result = await ensureLensResult(
            fetchNotifications(lensSessionHolder.sessionClient, {
                cursor: ensureCursor(indicator),
                filter: {
                    includeLowScore: !highSignalFilter,
                },
            }),
        );

        const data = await Promise.all(
            filterNotifications(result.items).map<Promise<Notification | null>>(async (item) => {
                if (isRepostNotification(item)) {
                    if (!item.reposts.length) return null;

                    const time = first(item.reposts)?.repostedAt;
                    const post = await formatLensQuoteOrCommentV3(item.post);
                    if (!post) return null;

                    return {
                        source: Source.Lens,
                        notificationId: item.id,
                        type: NotificationType.Mirror,
                        mirrors: item.reposts.map((x) => formatLensProfileV3(x.account)),
                        post,
                        timestamp: time ? new Date(time).getTime() : undefined,
                    };
                }

                if (isQuoteNotification(item)) {
                    const time = item.quote.timestamp;

                    const quoteOf = await formatLensQuoteOrCommentV3(item.quote.quoteOf, 'Quote');
                    if (!quoteOf) return null;

                    return {
                        source: Source.Lens,
                        notificationId: item.id,
                        type: NotificationType.Quote,
                        quote: await formatLensPostV3(item.quote),
                        post: quoteOf,
                        timestamp: time ? new Date(time).getTime() : undefined,
                    };
                }

                if (isReactionNotification(item)) {
                    if (!item.reactions.length) return null;
                    const time = first(flatMap(item.reactions.map((x) => x.reactions)))?.reactedAt;
                    const post = await formatLensQuoteOrCommentV3(item.post);
                    if (!post) return null;

                    return {
                        source: Source.Lens,
                        notificationId: item.id,
                        type: NotificationType.Reaction,
                        reaction: ReactionType.Upvote,
                        reactors: item.reactions.map((x) => formatLensProfileV3(x.account)),
                        post,
                        timestamp: time ? new Date(time).getTime() : undefined,
                    };
                }

                if (isCommentNotification(item)) {
                    const commentOn = await formatLensQuoteOrCommentV3(item.comment.commentOn, 'Comment');
                    if (!commentOn) return null;

                    return {
                        source: Source.Lens,
                        notificationId: item.id,
                        type: NotificationType.Comment,
                        comment: await formatLensPostV3(item.comment),
                        post: commentOn,
                        timestamp: new Date(item.comment.timestamp).getTime(),
                    };
                }

                if (isFollowNotification(item)) {
                    if (!item.followers.length) return null;

                    return {
                        source: Source.Lens,
                        notificationId: item.id,
                        type: NotificationType.Follow,
                        followers: item.followers.map((x) => formatLensProfileV3(x.account)),
                    };
                }

                if (isMentionNotification(item)) {
                    const post = await formatLensQuoteOrCommentV3(item.post);
                    if (!post) return null;

                    return {
                        source: Source.Lens,
                        notificationId: item.id,
                        type: NotificationType.Mention,
                        post,
                        timestamp: new Date(item.post.timestamp).getTime(),
                    };
                }

                if (isAccountActionExecutedNotification(item)) {
                    return null;
                }

                if (isGroupMembershipRequestApprovedNotification(item)) {
                    return null;
                }

                if (isGroupMembershipRequestRejectedNotification(item)) {
                    return null;
                }

                if (isPostActionExecutedNotification(item)) {
                    return null;
                }

                return null;
            }),
        );

        // filter muted/blocked items
        const profileIds = compact(
            data.flatMap((x) => {
                if (!x) return null;
                if ('followers' in x) return x.followers.map((follower) => follower.profileId);
                if ('mirrors' in x) return x.mirrors.map((mirror) => mirror.profileId);
                if ('reactors' in x) return x.reactors.map((reactor) => reactor.profileId);
                return x?.post?.author.profileId;
            }),
        );
        const blockList = await FireflyEndpointProvider.getBlockRelation(
            profileIds.map((snsId) => ({ snsId, snsPlatform: FireflyPlatform.Lens })),
        );

        const profileIdSet = new Set(blockList.filter((x) => x.blocked).map((x) => x.snsId));

        const items = compact(data)
            .map((item) => {
                if (!item) return item;
                if ('followers' in item) {
                    item.followers = item.followers.filter((x) => !profileIdSet.has(x.profileId));
                }
                if ('mirrors' in item) {
                    item.mirrors = item.mirrors.filter((x) => !profileIdSet.has(x.profileId));
                }
                if ('reactors' in item) {
                    item.reactors = item.reactors.filter((x) => !profileIdSet.has(x.profileId));
                }
                return item;
            })
            .filter((item) => {
                if (!item) return false;
                if ('followers' in item && item.followers.length <= 0) return false;
                if ('mirrors' in item && item.mirrors.length <= 0) return false;
                if ('reactors' in item && item.reactors.length <= 0) return false;
                if ('post' in item && item.post?.author.profileId && profileIdSet.has(item.post.author.profileId)) {
                    return false;
                }
                if (
                    'comment' in item &&
                    item.comment?.author.profileId &&
                    profileIdSet.has(item.comment.author.profileId)
                ) {
                    return false;
                }
                if ('quote' in item && item.quote?.author.profileId && profileIdSet.has(item.quote.author.profileId)) {
                    return false;
                }
                return true;
            });

        return createPageable(
            items,
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        const settings = await FireflySocialMediaProvider.getNotificationPushSwitch();
        const current = settings.list.find((x) => x.title === NotificationTitle.NotificationsMode);

        return {
            priority:
                current?.list.find(
                    (x) => x.platform === NotificationPlatform.Priority && x.push_type === NotificationPushType.Lens,
                )?.state ?? false,
        };
    }

    async setNotificationSettings(settings: NotificationSettings) {
        await FireflySocialMediaProvider.setNotificationPushSwitch({
            list: [
                {
                    platform: NotificationPlatform.Priority,
                    push_type: NotificationPushType.Lens,
                    state: settings.priority,
                },
            ],
        });
        return true;
    }

    async getSuggestedFollows(indicator?: PageIndicator): Promise<Pageable<Profile>> {
        const profile = getCurrentProfile(Source.Lens);
        const result = await ensureLensResult(
            profile
                ? fetchAccountRecommendations(getClient(), {
                      cursor: ensureCursor(indicator),
                      pageSize: PageSize.Fifty,
                      account: evmAddress(profile.profileId),
                  })
                : fetchAccounts(getClient(), {
                      cursor: ensureCursor(indicator),
                      pageSize: PageSize.Fifty,
                      orderBy: AccountsOrderBy.AccountScore,
                  }),
        );

        return createPageable(
            result?.items.map(formatLensProfileV3) || EMPTY_LIST,
            createIndicator(indicator),
            result?.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const result = await ensureLensResult(
            fetchAccounts(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                orderBy: AccountsOrderBy.BestMatch,
                filter: {
                    searchBy: { localNameQuery: q, namespaces: [] },
                },
            }),
        );
        return createPageable(
            result.items.map(formatLensProfileV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async searchPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    searchQuery: q,
                },
            }),
        );
        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getThreadByPostId(postId: string) {
        const response = await fetchJSON<ResponseJSON<string[]>>(urlcat('/api/thread', { id: postId }));
        if (!response.success) return EMPTY_LIST;
        const posts = await ensureLensResult(
            fetchPosts(getClient(), {
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: {
                        tags: { all: [postId, ...response.data] }, // TODO
                    },
                },
            }),
        );

        return Promise.all(posts.items.map(formatLensPostV3));
    }

    async blockProfile(profileId: string) {
        await ensureLensResult(muteAccount(lensSessionHolder.sessionClient, { account: evmAddress(profileId) }));
        await runInSafeAsync(() => FireflyEndpointProvider.blockProfileFor(FireflyPlatform.Lens, profileId));
        return true;
    }

    async unblockProfile(profileId: string) {
        await ensureLensResult(
            unmuteAccount(lensSessionHolder.sessionClient, {
                account: evmAddress(profileId),
            }),
        );
        await runInSafeAsync(() => FireflyEndpointProvider.unblockProfileFor(FireflyPlatform.Lens, profileId));
        return true;
    }

    async getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        return FireflySocialMediaProvider.getBlockedProfiles(indicator, SourceInURL.Lens);
    }

    async getLikeReactors(postId: string, indicator?: PageIndicator) {
        const result = await ensureLensResult(
            fetchPostReactions(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                post: postId,
                filter: {
                    anyOf: [PostReactionType.Upvote],
                },
            }),
        );
        if (!result) throw new Error('No one likes this post yet.');
        const profiles = result.items.map((item) => formatLensProfileV3(item.account));
        return createPageable(
            profiles,
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }
    async getRepostReactors(postId: string, indicator?: PageIndicator) {
        const result = await ensureLensResult(
            fetchWhoReferencedPost(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                post: postId,
                referenceTypes: [PostReferenceType.RepostOf],
            }),
        );
        if (!result) throw new Error('No one likes this post yet.');
        const profiles = result.items.map(formatLensProfileV3);
        return createPageable(
            profiles,
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getPostsQuoteOn(postId: string, indicator?: PageIndicator) {
        const result = await ensureLensResult(
            fetchPostReferences(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                referencedPost: postId,
                referenceTypes: [PostReferenceType.QuoteOf],
            }),
        );
        if (!result) throw new Error('No one likes this post yet.');
        const posts = result.items.map(formatLensPostV3);
        return createPageable(
            await Promise.all(posts),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }
    async bookmark(postId: string): Promise<boolean> {
        await ensureLensResult(
            bookmarkPost(lensSessionHolder.sessionClient, {
                post: postId,
            }),
        );
        return true;
    }

    async unbookmark(postId: string): Promise<boolean> {
        await ensureLensResult(
            undoBookmarkPost(lensSessionHolder.sessionClient, {
                post: postId,
            }),
        );
        return true;
    }

    async getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPostBookmarks(lensSessionHolder.sessionClient, {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
            }),
        );
        const profiles = result.items.map(formatLensPostV3);
        return createPageable(
            await Promise.all(profiles),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getHiddenComments(postId: string, indicator?: PageIndicator) {
        const result = await ensureLensResult(
            fetchPostReferences(getClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                referenceTypes: [PostReferenceType.CommentOn],
                referencedPost: postId,
                relevancyFilter: ReferenceRelevancyFilter.NotRelevant,
                visibilityFilter: PostVisibilityFilter.Visible,
            }),
        );

        if (!result) throw new Error('No comments found');

        return createPageable(
            await Promise.all(result.items.map(formatLensPostV3)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async reportProfile(profileId: string) {
        await ensureLensResult(
            reportAccount(lensSessionHolder.sessionClient, {
                account: evmAddress(profileId),
                reason: AccountReportReason.RepetitiveSpam, // TODO: user select reason
            }),
        );

        return true;
    }

    async reportPost(post: Post) {
        const postId = post.postId;
        await ensureLensResult(
            reportPost(lensSessionHolder.sessionClient, {
                post: postId,
                reason: PostReportReason.Scam, // TODO: user select reason
            }),
        );
        // report to firefly
        return FireflySocialMediaProvider.reportPost(post);
    }

    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        const attributes: MetadataAttribute[] = compact([
            profile.website ? { type: MetadataAttributeType.STRING, key: 'website', value: profile.website } : null,
            profile.location ? { type: MetadataAttributeType.STRING, key: 'location', value: profile.location } : null,
        ]);
        const metadata = account({
            id: uuid(),
            name: profile.displayName,
            bio: profile.bio || undefined,
            picture: profile.pfp || undefined,
            attributes: attributes.length ? attributes : undefined,
        });
        const metadataURI = await uploadLensMetadataToS3(metadata);
        const result = await ensureLensResult(
            setAccountMetadata(lensSessionHolder.sessionClient, {
                metadataUri: metadataURI,
            }),
        );
        await handleOperationWithLensChain(result);
        return true;
    }

    async queryApprovedModuleAllowanceData(
        spender: string,
        openAction?: any, // TODO: OpenActionModuleType
        follow?: any, // TODO: FollowModuleType
        reference?: any, // TODO: ReferenceModuleType
    ) {
        throw new NotImplementedError();
    }

    async approveModuleAllowance(
        module: any, // TODO: ApprovedAllowanceAmountResultFragment
        amount: string,
        currencyAddress?: string,
    ) {
        throw new NotImplementedError();
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        const result = await ensureLensResult(
            joinLensGroup(lensSessionHolder.sessionClient, {
                group: evmAddress(channel.id),
            }),
        );
        await handleOperationWithLensChain(result);
        return true;
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        const result = await ensureLensResult(
            leaveLensGroup(lensSessionHolder.sessionClient, {
                group: evmAddress(channel.id),
            }),
        );
        await handleOperationWithLensChain(result);
        return true;
    }

    async getPinnedPost(profileId: string): Promise<Post | null> {
        throw new NotImplementedError();
    }

    async decryptPost(post: Post): Promise<Post | null> {
        throw new NotImplementedError();
    }

    async getGroupMembersCount(groupId: string): Promise<number> {
        const result = await ensureLensResult(
            fetchGroupStats(getClient(), {
                group: evmAddress(groupId),
            }),
        );

        return result?.totalMembers || 0;
    }
}

export const LensSocialMediaProvider = new LensSocialMedia();
