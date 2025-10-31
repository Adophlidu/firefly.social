import { unreachable } from '@dimensiondev/utils';
import {
    type Account,
    AccountReportReason,
    AccountsOrderBy,
    GroupsOrderBy,
    MainContentFocus,
    ManagedAccountsVisibility,
    type MetadataAttribute,
    MetadataAttributeType,
    PageSize,
    postId as toPostId,
    PostReactionType,
    PostReferenceType,
    PostReportReason,
    PostType,
    PostVisibilityFilter,
    ReferenceRelevancyFilter,
    TimelineEventItemType,
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
    fetchTimeline,
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
import { compact, first, flatMap, uniqBy, uniqWith } from 'lodash-es';
import urlcat from 'urlcat';

import { FireflyPlatform, Source, SourceInURL } from '@/constants/enum.js';
import { InvalidResultError, NotImplementedError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { AddAuthorHighlightStatusForPosts } from '@/decorators/AddProfileHighlightStatus.js';
import { SetQueryDataForActPost } from '@/decorators/SetQueryDataForActPost.js';
import { SetQueryDataForApprovalLensModule } from '@/decorators/SetQueryDataForApprovalLensModule.js';
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
import { SetQueryDataForSuperFollowProfile } from '@/decorators/SetQueryDataForSuperFollowProfile.js';
import { WithMutedProfilesQuery } from '@/decorators/WithMutedProfilesQuery.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
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
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { ensurePostToLensResult } from '@/providers/lens/ensurePostToLensResult.js';
import { filterNotifications } from '@/providers/lens/filterNotifications.js';
import { formatLensChannelFromGroup } from '@/providers/lens/formatLensChannel.js';
import {
    filterFeedsV3,
    formatLensPostByFeedV3,
    formatLensPostV3,
    formatLensQuoteOrCommentV3,
} from '@/providers/lens/formatLensPost.js';
import { formatLensPostRules } from '@/providers/lens/formatLensPostRules.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getAccountWithStatsById } from '@/providers/lens/getAccountWithStats.js';
import { getGroupWithMemberCount, getGroupWithOwner } from '@/providers/lens/getFullGroup.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { getLensCommentsById } from '@/providers/lens/getLensCommentsById.js';
import { getLensPostById } from '@/providers/lens/getLensPostById.js';
import { getLensProfileByHandle } from '@/providers/lens/getLensProfileByHandle.js';
import { getLensProfileBySession } from '@/providers/lens/getLensProfileBySession.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { isMutedLensAccount } from '@/providers/lens/isMutedLensAccount.js';
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
import { account } from '@/providers/lens/metadata/Account.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { uploadLensMetadataToS3 } from '@/providers/lens/uploadLensMetadataToS3.js';
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
import type { ResponseJson } from '@/types/utility.js';

@WithMutedProfilesQuery()
@SetQueryDataForLikePost(Source.Lens)
@SetQueryDataForBookmarkPost(Source.Lens)
@SetQueryDataForMirrorPost(Source.Lens)
@SetQueryDataForCommentPost(Source.Lens)
@SetQueryDataForDeletePost(Source.Lens)
@SetQueryDataForBlockProfile(Source.Lens)
@SetQueryDataForFollowProfile(Source.Lens)
@SetQueryDataForSuperFollowProfile(Source.Lens)
@SetQueryDataForActPost(Source.Lens)
@SetQueryDataForReportPost(Source.Lens)
@SetQueryDataForJoinChannel(Source.Lens)
@SetQueryDataForPosts
@SetQueryDataForApprovalLensModule
@AddAuthorHighlightStatusForPosts(Source.Lens)
class LensSocialMedia implements Provider {
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
            fetchGroups(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                orderBy: GroupsOrderBy.Alphabetical,
                filter: {
                    member: safeEvmAddress(profileId),
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
            fetchPosts(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    feeds: [{ feed: safeEvmAddress(channelId) }],
                    metadata: null,
                },
            }),
        );

        return createPageable(
            filterFeedsV3(compact(result.items)).map(formatLensPostV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    getPostsByChannelHandle(channelHandle: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        const result = await ensureLensResult(
            fetchGroups(getLensClient(), {
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
            fetchGroupMembers(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                group: safeEvmAddress(channelId),
            }),
        );

        return createPageable(
            result.items.map((x) => formatLensProfileV3(x.account as Account)),
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
                feed: draftPost.channel?.feedId ? safeEvmAddress(draftPost.channel.feedId) : undefined,
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
                feed: draftPost.channel?.id ? safeEvmAddress(draftPost.channel.id) : undefined,
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
                feed: draftPost.channel?.id ? safeEvmAddress(draftPost.channel.id) : undefined,
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
                managedBy: safeEvmAddress(address),
                pageSize: PageSize.Fifty,
                includeOwned: true,
                hiddenFilter: ManagedAccountsVisibility.All,
            }),
        );
        return profiles.items.map((x) => ({
            ...formatLensProfileV3(x.account as Account),
            profileType: x.__typename,
        }));
    }

    async getProfileById(profileId: string, includeGraphStats?: boolean): Promise<Profile> {
        if (includeGraphStats) {
            return getAccountWithStatsById(profileId);
        }
        const result = await ensureLensResult(fetchAccount(getLensClient(), { address: safeEvmAddress(profileId) }));
        if (!result) throw new Error('No profile found');

        return formatLensProfileV3(result);
    }

    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        if (!ids.length) return [];
        const result = await ensureLensResult(
            fetchAccountsBulk(getLensClient(), {
                addresses: ids.map(safeEvmAddress),
            }),
        );
        const profiles = result.map(formatLensProfileV3);

        return profiles;
    }

    async getProfileByHandle(handle: string, includeGraphStats?: boolean): Promise<Profile> {
        return getLensProfileByHandle(handle, includeGraphStats);
    }

    async getProfileBySession(session: Session): Promise<Profile> {
        return getLensProfileBySession(session as LensSession);
    }

    async getProfileByIdOrHandle(profileIdOrHandle: string, includeGraphStats?: boolean): Promise<Profile> {
        if (isValidAddressEthereum(profileIdOrHandle)) return this.getProfileById(profileIdOrHandle, includeGraphStats);
        return this.getProfileByHandle(profileIdOrHandle, includeGraphStats);
    }

    async getPostById(postId: string, isLegacy = false): Promise<Post> {
        return getLensPostById(postId, isLegacy);
    }

    async getPostByTxHashWithPolling(txHash: string): Promise<Post> {
        const getPostByTxHash = async (txHash: string): Promise<Post> => {
            const result = await ensureLensResult(fetchPost(getLensClient(), { txHash }));
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
        return getLensCommentsById(postId, indicator, hasFilter);
    }

    async getCommentsByProfileId(postId: string, profileId: string, indicator?: PageIndicator) {
        const result = await ensureLensResult(
            fetchPostReferences(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                referencedPost: postId,
                referenceTypes: [PostReferenceType.CommentOn],
            }),
        );
        if (!result) return createPageable([], createIndicator(indicator));

        const posts = result.items.map(formatLensPostV3);
        return createPageable(
            posts,
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPostsToExplore(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
            }),
        );

        if (!result) return createPageable([], createIndicator(indicator));

        const posts = filterFeedsV3(compact(result.items)).map(formatLensPostV3);
        return createPageable(
            posts,
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async discoverPostsById(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchTimeline(lensSessionHolder.sessionClient, {
                cursor: ensureCursor(indicator),
                filter: {
                    eventType: [TimelineEventItemType.Post, TimelineEventItemType.Quote, TimelineEventItemType.Repost],
                },
                account: safeEvmAddress(profileId),
            }),
        );

        const posts = compact(result.items.map(formatLensPostByFeedV3)).filter(
            (post) => !post.author.viewerContext?.blocking && !post.hasReported,
        );
        return createPageable(
            posts,
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getCollectedPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    collectedBy: {
                        account: safeEvmAddress(profileId),
                    },
                },
            }),
        );

        const posts = uniqWith(result.items.map(formatLensPostV3), isSamePost);
        return createPageable(
            posts,
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    authors: [safeEvmAddress(profileId)],
                    postTypes: [PostType.Root, PostType.Repost, PostType.Quote],
                },
            }),
        );

        return createPageable(
            result.items.map(formatLensPostV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getRepliesPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    authors: [safeEvmAddress(profileId)],
                    postTypes: [PostType.Comment],
                },
            }),
        );

        return createPageable(
            result.items.map(formatLensPostV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getMediaPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        const result = await ensureLensResult(
            fetchPosts(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    authors: [safeEvmAddress(profileId)],
                    metadata: {
                        mainContentFocus: [MainContentFocus.Image, MainContentFocus.Audio, MainContentFocus.Video],
                    },
                    postTypes: [PostType.Root, PostType.Repost, PostType.Quote, PostType.Comment],
                },
            }),
        );

        return createPageable(
            result.items.map(formatLensPostV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    // TODO: Invalid
    async getPostsBeMentioned(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        const result = await ensureLensResult(
            fetchPosts(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    authors: [safeEvmAddress(profileId)],
                },
            }),
        );

        return createPageable(
            result.items.map(formatLensPostV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getPostsLiked(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    async getPostsReplies(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        const result = await ensureLensResult(
            fetchPosts(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    authors: [safeEvmAddress(profileId)],
                    postTypes: [PostType.Comment],
                },
            }),
        );

        return createPageable(
            result.items.map(formatLensPostV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getPostsByParentPostId(postId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
        const result = await ensureLensResult(
            fetchPostReferences(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                referencedPost: postId,
                referenceTypes: [PostReferenceType.CommentOn],
            }),
        );

        return createPageable(
            result.items.map(formatLensPostV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async follow(profileId: string): Promise<boolean> {
        const result = await ensureLensResult(
            follow(lensSessionHolder.sessionClient, { account: safeEvmAddress(profileId) }),
        );
        await handleOperationWithLensChain(result);
        return true;
    }

    async superFollow(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async unfollow(profileId: string): Promise<boolean> {
        const result = await ensureLensResult(
            unfollow(lensSessionHolder.sessionClient, { account: safeEvmAddress(profileId) }),
        );
        await handleOperationWithLensChain(result);
        return true;
    }

    async getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        const result = await ensureLensResult(
            fetchFollowers(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                account: safeEvmAddress(profileId),
            }),
        );

        return createPageable(
            result.items.map((x) => formatLensProfileV3(x.follower as Account)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        const result = await ensureLensResult(
            fetchFollowing(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                account: safeEvmAddress(profileId),
            }),
        );

        return createPageable(
            result.items.map((x) => formatLensProfileV3(x.following as Account)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }
    async getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const session = getSessionFromStorage(SessionType.Lens);

        if (!session?.profileId || isSameEthereumAddress(session.profileId, profileId))
            return createPageable([], createIndicator(indicator));

        const result = await ensureLensResult(
            fetchFollowersYouKnow(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                observer: session.profileId,
                target: safeEvmAddress(profileId),
            }),
        );

        return createPageable(
            result.items.map((x) => formatLensProfileV3(x.follower as Account)),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async isFollowedByMe(profileId: string): Promise<boolean> {
        const session = getSessionFromStorage(SessionType.Lens);
        if (!session) return false;

        const result = await ensureLensResult(
            fetchFollowStatus(getLensClient(), {
                pairs: [
                    {
                        account: safeEvmAddress(profileId),
                        follower: safeEvmAddress(session.profileId),
                    },
                ],
            }),
        );

        return first(result)?.isFollowing.onChain ?? false;
    }

    async isFollowingMe(profileId: string): Promise<boolean> {
        const session = getSessionFromStorage(SessionType.Lens);
        if (!session) return false;

        const result = await ensureLensResult(
            fetchFollowStatus(getLensClient(), {
                pairs: [
                    {
                        account: safeEvmAddress(session.profileId),
                        follower: safeEvmAddress(profileId),
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

        const data = filterNotifications(result.items).map<Notification | null>((item) => {
            if (isRepostNotification(item)) {
                if (!item.reposts.length) return null;
                if (item.reposts.some((x) => isMutedLensAccount(x.account))) return null;

                const time = first(item.reposts)?.repostedAt;
                const post = formatLensQuoteOrCommentV3(item.post);
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
                if (isMutedLensAccount(item.quote.author)) return null;

                const time = item.quote.timestamp;
                const quoteOf = formatLensQuoteOrCommentV3(item.quote.quoteOf, 'Quote');
                if (!quoteOf) return null;

                return {
                    source: Source.Lens,
                    notificationId: item.id,
                    type: NotificationType.Quote,
                    quote: formatLensPostV3(item.quote),
                    post: quoteOf,
                    timestamp: time ? new Date(time).getTime() : undefined,
                };
            }

            if (isReactionNotification(item)) {
                if (!item.reactions.length) return null;
                if (item.reactions.some((x) => isMutedLensAccount(x.account))) return null;

                const time = first(flatMap(item.reactions.map((x) => x.reactions)))?.reactedAt;
                const post = formatLensQuoteOrCommentV3(item.post);
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
                if (isMutedLensAccount(item.comment.author)) return null;

                const commentOn = formatLensQuoteOrCommentV3(item.comment.commentOn, 'Comment');
                if (!commentOn) return null;

                return {
                    source: Source.Lens,
                    notificationId: item.id,
                    type: NotificationType.Comment,
                    comment: formatLensPostV3(item.comment),
                    post: commentOn,
                    timestamp: new Date(item.comment.timestamp).getTime(),
                };
            }

            if (isFollowNotification(item)) {
                if (!item.followers.length) return null;
                if (item.followers.some((x) => isMutedLensAccount(x.account))) return null;

                return {
                    source: Source.Lens,
                    notificationId: item.id,
                    type: NotificationType.Follow,
                    followers: uniqBy(
                        item.followers.map((x) => formatLensProfileV3(x.account)),
                        (x) => x.profileId,
                    ),
                };
            }

            if (isMentionNotification(item)) {
                if (isMutedLensAccount(item.post.author)) return null;

                const post = formatLensQuoteOrCommentV3(item.post);
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
        });

        return createPageable(
            compact(data),
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
        const session = getSessionFromStorage(SessionType.Lens);
        const result = await ensureLensResult(
            session
                ? fetchAccountRecommendations(getLensClient(), {
                      cursor: ensureCursor(indicator),
                      pageSize: PageSize.Fifty,
                      account: safeEvmAddress(session.profileId),
                  })
                : fetchAccounts(getLensClient(), {
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
            fetchAccounts(getLensClient(), {
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
            fetchPosts(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                filter: {
                    metadata: null,
                    searchQuery: q,
                },
            }),
        );
        return createPageable(
            result.items.map(formatLensPostV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getThreadByPostId(postId: string) {
        const response = await fetchJson<ResponseJson<string[]>>(urlcat('/api/thread', { id: postId }));
        if (!response.success) return EMPTY_LIST;

        const posts = await ensureLensResult(
            fetchPosts(getLensClient(), {
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
        await ensureLensResult(muteAccount(lensSessionHolder.sessionClient, { account: safeEvmAddress(profileId) }));
        await runInSafeAsync(() => FireflyEndpointProvider.blockProfileFor(FireflyPlatform.Lens, profileId));
        return true;
    }

    async unblockProfile(profileId: string) {
        await ensureLensResult(
            unmuteAccount(lensSessionHolder.sessionClient, {
                account: safeEvmAddress(profileId),
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
            fetchPostReactions(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                post: postId,
                filter: {
                    anyOf: [PostReactionType.Upvote],
                },
            }),
        );
        if (!result) throw new Error('No one likes this post yet.');
        const profiles = result.items.map((item) => formatLensProfileV3(item.account as Account));
        return createPageable(
            profiles,
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }
    async getRepostReactors(postId: string, indicator?: PageIndicator) {
        const result = await ensureLensResult(
            fetchWhoReferencedPost(getLensClient(), {
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
            fetchPostReferences(getLensClient(), {
                cursor: ensureCursor(indicator),
                pageSize: PageSize.Fifty,
                referencedPost: postId,
                referenceTypes: [PostReferenceType.QuoteOf],
            }),
        );
        if (!result) throw new Error('No one likes this post yet.');
        const posts = result.items.map(formatLensPostV3);
        return createPageable(
            posts,
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
        const posts = result.items.map(formatLensPostV3);
        return createPageable(
            posts,
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async getHiddenComments(postId: string, indicator?: PageIndicator) {
        const result = await ensureLensResult(
            fetchPostReferences(getLensClient(), {
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
            result.items.map(formatLensPostV3),
            createIndicator(indicator),
            result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
        );
    }

    async reportProfile(profileId: string) {
        await ensureLensResult(
            reportAccount(lensSessionHolder.sessionClient, {
                account: safeEvmAddress(profileId),
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
            profile.website
                ? {
                      __typename: 'MetadataAttribute',
                      type: MetadataAttributeType.String,
                      key: 'website',
                      value: profile.website,
                  }
                : null,
            profile.location
                ? {
                      __typename: 'MetadataAttribute',
                      type: MetadataAttributeType.String,
                      key: 'location',
                      value: profile.location,
                  }
                : null,
        ]);
        const metadata = account({
            id: crypto.randomUUID(),
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
        openAction?: unknown, // TODO: OpenActionModuleType
        follow?: unknown, // TODO: FollowModuleType
        reference?: unknown, // TODO: ReferenceModuleType
    ) {
        throw new NotImplementedError();
    }

    async approveModuleAllowance(
        module: { allowance: { asset: { contract: { address: string } } } }, // TODO: ApprovedAllowanceAmountResultFragment
        amount: string,
        currencyAddress?: string,
    ) {
        throw new NotImplementedError();
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        const result = await ensureLensResult(
            joinLensGroup(lensSessionHolder.sessionClient, {
                group: safeEvmAddress(channel.id),
            }),
        );
        await handleOperationWithLensChain(result);
        return true;
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        const result = await ensureLensResult(
            leaveLensGroup(lensSessionHolder.sessionClient, {
                group: safeEvmAddress(channel.id),
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
            fetchGroupStats(getLensClient(), {
                group: safeEvmAddress(groupId),
            }),
        );

        return result?.totalMembers || 0;
    }
}

export { LensSocialMedia };
export const LensSocialMediaProvider = new LensSocialMedia();
