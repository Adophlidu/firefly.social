import {
    AppBskyActorDefs,
    AppBskyEmbedExternal,
    AppBskyEmbedImages,
    AppBskyEmbedRecord,
    AppBskyEmbedVideo,
    AppBskyFeedDefs,
    AppBskyRichtextFacet,
} from '@atproto/api';

export const AppBskyEmbed = {
    isImage: (v: unknown): v is AppBskyEmbedImages.View => AppBskyEmbedImages.isView(v),
    isExternal: (v: unknown): v is AppBskyEmbedExternal.View => AppBskyEmbedExternal.isView(v),
    isVideo: (v: unknown): v is AppBskyEmbedVideo.View => AppBskyEmbedVideo.isView(v),
    isLinkFacet: (v: unknown): v is AppBskyRichtextFacet.Link => AppBskyRichtextFacet.isLink(v),
};
export const AppBskyRecord = {
    isEmbedRecord: (v: unknown): v is AppBskyEmbedRecord.ViewRecord => AppBskyEmbedRecord.isViewRecord(v),
};
export const AppBskyFeed = {
    isThreadViewPost: (v: unknown): v is AppBskyFeedDefs.ThreadViewPost => AppBskyFeedDefs.isThreadViewPost(v),
    isPostView: (v: unknown): v is AppBskyFeedDefs.PostView => AppBskyFeedDefs.isPostView(v),
    isReasonRepost: (v: unknown): v is AppBskyFeedDefs.ReasonRepost => AppBskyFeedDefs.isReasonRepost(v),
};

export const AppBskyProfile = {
    isProfileViewBasic: (v: unknown): v is AppBskyActorDefs.ProfileViewBasic => AppBskyActorDefs.isProfileViewBasic(v),
    isProfileView: (v: unknown): v is AppBskyActorDefs.ProfileView => AppBskyActorDefs.isProfileView(v),
    isProfileViewDetailed: (v: unknown): v is AppBskyActorDefs.ProfileViewDetailed =>
        AppBskyActorDefs.isProfileViewDetailed(v),
};
