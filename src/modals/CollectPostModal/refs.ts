import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export interface CollectPostModalOpenProps {
    post: Post;
}

export type CollectPostModalRefType = SingletonModalRefCreator<CollectPostModalOpenProps>;

export const CollectPostModalRef = new SingletonModal<CollectPostModalOpenProps>();
