import type { Profile } from '@/providers/types/SocialMedia.js';

/**
 * Tunable follower threshold above which a profile is considered worth indexing
 * on the strength of its audience alone. Kept intentionally low because
 * `followerCount` is sometimes unreliable (some sources report it via RPC and
 * can return 0 for real, well-known accounts), so it is only ever an additive
 * signal — never a reason to exclude an otherwise-rich profile.
 */
const MIN_FOLLOWERS_TO_INDEX = 20;

/**
 * Decide whether a social profile page is rich enough to let search engines
 * index it. Empty-shell profiles (no real display name, no bio, no meaningful
 * follower count) dilute domain quality, so they should be served `noindex`.
 *
 * The logic is deliberately OR-based: any single real signal keeps the profile
 * indexable. This is forgiving on purpose — it guards against a known bug where
 * some sources report `followerCount` as 0 for real accounts, so a genuine
 * display name or bio alone is enough to keep such profiles indexed.
 */
export function shouldIndexProfile(
    profile: Pick<Profile, 'displayName' | 'handle' | 'bio' | 'followerCount'>,
): boolean {
    const displayName = profile.displayName?.trim();
    const handle = profile.handle?.trim().toLowerCase();

    // A real display name that is distinct from the handle.
    if (displayName && displayName.toLowerCase() !== handle) return true;

    // A non-empty bio.
    if (profile.bio?.trim()) return true;

    // A meaningful follower count (additive signal only; see constant above).
    if (Number.isFinite(profile.followerCount) && profile.followerCount >= MIN_FOLLOWERS_TO_INDEX) return true;

    return false;
}
