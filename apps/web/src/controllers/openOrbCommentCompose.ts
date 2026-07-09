import { Source } from '@dimensiondev/enums';

import { WORLDCUP_2026_GROUP } from '@/constants/channel.js';
import { openComposeModal } from '@/controllers/openComposeModal.js';
import type { Lpt1PositionInput } from '@/helpers/lpt1.js';
import { buildLpt1PositionAttributes, buildLpt1Tags } from '@/helpers/lpt1.js';

export interface OpenOrbCommentComposeOptions {
    /** Event slug = the detail-page route param `[id]` (a valid LPT-1 direct item key). */
    eventSlug: string;
    /** The author's position in the event, if any (emits the position signal tag + attributes). */
    position?: Lpt1PositionInput;
}

/**
 * Open the compose modal pre-filled to publish an Orb (LPT-1) comment into the
 * WorldCup2026 Lens group: Lens-only, single root post (thread locked), carrying
 * the LPT-1 tags + optional position attributes for the given event.
 */
export function openOrbCommentCompose({ eventSlug, position }: OpenOrbCommentComposeOptions) {
    return openComposeModal({
        source: [Source.Lens],
        channel: WORLDCUP_2026_GROUP,
        lockThread: true,
        lpt1Tags: buildLpt1Tags({ eventSlug, hasPosition: !!position }),
        lpt1Attributes: position ? buildLpt1PositionAttributes(position) : undefined,
    });
}
