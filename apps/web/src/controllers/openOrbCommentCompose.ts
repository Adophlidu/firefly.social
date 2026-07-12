import { Source } from '@dimensiondev/enums';

import { WORLDCUP_2026_GROUP } from '@/constants/channel.js';
import { openComposeModal } from '@/controllers/openComposeModal.js';
import { buildOrbComposePayload, type Lpt1PositionInput } from '@/helpers/lpt1.js';

export interface OpenOrbCommentComposeOptions {
    /** Event slug = the detail-page route param `[id]` (a valid LPT-1 direct item key). */
    eventSlug: string;
    /** The author's position in the event, if any (emits position signal + data tags + attributes). */
    position?: Lpt1PositionInput;
}

/**
 * Open the compose modal pre-filled to publish an Orb (LPT-1) comment into the
 * WorldCup2026 Lens group: Lens-only, single root post (thread locked), carrying
 * the LPT-1 tags + optional position attributes for the given event.
 *
 * The LPT-1 payload is built by `buildOrbComposePayload`, which is shared with
 * the reply path (`OrbCommentCell`) so a root comment and a reply from the same
 * author/event can't drift. The World Cup interop tags are only attached for
 * FIFA (`fifwc*`) event slugs so non-FIFA comments do not appear in the Home
 * World Cup feed.
 */
export function openOrbCommentCompose({ eventSlug, position }: OpenOrbCommentComposeOptions) {
    return openComposeModal({
        source: [Source.Lens],
        channel: WORLDCUP_2026_GROUP,
        lockThread: true,
        ...buildOrbComposePayload({ eventSlug, position }),
    });
}
