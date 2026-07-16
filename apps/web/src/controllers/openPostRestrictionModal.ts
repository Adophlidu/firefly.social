import { openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type {
    PostRestrictionModalCloseProps,
    PostRestrictionModalOpenProps,
} from '@/modals/PostRestrictionModal/refs.js';

export function openPostRestrictionModal(props: PostRestrictionModalOpenProps) {
    return openAndWaitForCloseModalEvent('post-restriction-modal', props) as Promise<PostRestrictionModalCloseProps>;
}
