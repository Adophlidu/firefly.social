import { AppBskyActorDefs } from '@atproto/api';
import { Source } from '@dimensiondev/enums';
import { first } from 'lodash-es';

import { BSKY_MENTION_REGEX } from '@/constants/regexp.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { AppBskyProfile } from '@/providers/bsky/contentChecker.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

function getDisplayNameFromHandle(handle: string) {
    // requirements:
    // 1. doesn't begin or end with a hyphen
    // 2. at least 3 characters
    // 3. only contains letters, numbers, and hyphens
    const matched = handle.match(/^(?!-)[A-Za-z0-9-]{3,}(?<!-)/) ?? [];
    return first(matched) ?? handle;
}

function parseBioContext(bio: string) {
    const mentions = bio.match(BSKY_MENTION_REGEX);
    if (!mentions) return;
    return { mentions: mentions.map((handle) => ({ source: Source.Bsky, id: handle })) };
}

function getProfileStatus(status?: AppBskyActorDefs.StatusView) {
    return AppBskyActorDefs.isStatusView(status)
        ? (status.isActive ?? true)
            ? ProfileStatus.Active
            : ProfileStatus.Inactive
        : ProfileStatus.Active;
}

function formatProfileViewBasic(
    profile: AppBskyActorDefs.ProfileViewBasic,
): Profile<AppBskyActorDefs.ProfileViewBasic> {
    return {
        ...createDummyProfile(Source.Bsky),
        profileId: profile.did,
        displayName: profile.displayName || getDisplayNameFromHandle(profile.handle),
        bio: '',
        bioContext: undefined,
        handle: profile.handle,
        fullHandle: profile.handle,
        pfp: profile.avatar ?? '',
        followerCount: 0,
        followingCount: 0,
        status: getProfileStatus(profile.status),
        viewerContext: profile.viewer
            ? {
                  following: !!profile.viewer.following,
                  followedBy: !!profile.viewer.followedBy,
                  // .blockedBy will block data request as well.
                  blocking: profile.viewer.muted,
              }
            : undefined,
        __original__: profile,
        __lazy__: true,
    };
}
function formatProfileView(profile: AppBskyActorDefs.ProfileView): Profile<AppBskyActorDefs.ProfileView> {
    return {
        ...createDummyProfile(Source.Bsky),
        profileId: profile.did,
        displayName: profile.displayName || getDisplayNameFromHandle(profile.handle),
        bio: profile.description ?? '',
        bioContext: parseBioContext(profile.description ?? ''),
        handle: profile.handle,
        fullHandle: profile.handle,
        pfp: profile.avatar ?? '',
        followerCount: 0,
        followingCount: 0,
        status: getProfileStatus(profile.status),
        viewerContext: profile.viewer
            ? {
                  following: !!profile.viewer.following,
                  followedBy: !!profile.viewer.followedBy,
                  // .blockedBy will block data request as well.
                  blocking: profile.viewer.muted,
              }
            : undefined,
        __original__: profile,
        __lazy__: true,
    };
}

type AllProfileType =
    | AppBskyActorDefs.ProfileViewDetailed
    | AppBskyActorDefs.ProfileView
    | AppBskyActorDefs.ProfileViewBasic;

export function formatBskyProfile(
    profile: AppBskyActorDefs.ProfileViewDetailed,
): Profile<AppBskyActorDefs.ProfileViewDetailed>;
export function formatBskyProfile(profile: AppBskyActorDefs.ProfileView): Profile<AppBskyActorDefs.ProfileView>;
export function formatBskyProfile(
    profile: AppBskyActorDefs.ProfileViewBasic,
): Profile<AppBskyActorDefs.ProfileViewBasic>;
export function formatBskyProfile(profile: AllProfileType): Profile<AllProfileType> {
    if (AppBskyProfile.isProfileViewBasic(profile)) return formatProfileViewBasic(profile);
    if (AppBskyProfile.isProfileView(profile)) return formatProfileView(profile);

    return {
        ...createDummyProfile(Source.Bsky),
        profileId: profile.did,
        displayName: profile.displayName || getDisplayNameFromHandle(profile.handle),
        bio: profile.description ?? '',
        bioContext: parseBioContext(profile.description ?? ''),
        handle: profile.handle,
        fullHandle: profile.handle,
        pfp: profile.avatar ?? '',
        followerCount: profile.followersCount ?? 0,
        followingCount: profile.followsCount ?? 0,
        status: getProfileStatus(profile.status),
        viewerContext: profile.viewer
            ? {
                  following: !!profile.viewer.following,
                  followedBy: !!profile.viewer.followedBy,
                  // .blockedBy will block data request as well.
                  blocking: profile.viewer.muted,
              }
            : undefined,
        __original__: profile,
    };
}
