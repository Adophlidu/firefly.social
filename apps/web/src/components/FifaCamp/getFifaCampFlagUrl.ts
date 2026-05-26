const FIFA_CAMP_ASSET_BASE = '/fifa-camp';

/** Figma 5800:236 — reference dimensions from world-cup AvatarBadge */
export const FIFA_CAMP_AVATAR_BASE_PHOTO_SIZE = 135.68;
export const FIFA_CAMP_AVATAR_BASE_OUTER_SIZE = 160;

export function getFifaCampAvatarOuterSize(photoSize: number) {
    return Math.ceil(FIFA_CAMP_AVATAR_BASE_OUTER_SIZE * (photoSize / FIFA_CAMP_AVATAR_BASE_PHOTO_SIZE));
}

export function getFifaCampAvatarRingUrl() {
    return `${FIFA_CAMP_ASSET_BASE}/avatar-ring.svg`;
}
