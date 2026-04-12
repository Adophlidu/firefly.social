import { ProfileInList } from '@/components/ProfileInList.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function getFollowInList(index: number, profile: Profile, listKey?: string) {
    return <ProfileInList profile={profile} key={`${profile.profileId}-${index}`} listKey={listKey} index={index} />;
}
