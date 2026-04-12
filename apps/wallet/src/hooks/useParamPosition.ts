import { parseJson } from '@dimensiondev/utils';
import { createParser, parseAsStringEnum, useQueryState } from 'nuqs';

import type { PolymarketPosition } from '@/providers/types/Firefly.js';

const PositionAction = {
    CLAIM_PROCEEDS: 'claim-proceeds',
    CLOSE_LOST_POSITION: 'close-lost-position',
} as const;

type PositionAction = (typeof PositionAction)[keyof typeof PositionAction];

const parseAsPosition = createParser({
    parse(value: string) {
        if (!value) return null;
        return parseJson<PolymarketPosition>(value) || null;
    },
    serialize(value: PolymarketPosition | null) {
        return JSON.stringify(value);
    },
});

export function useParamPosition() {
    // There is no such an API endpoint for querying a single position,
    // so we need to pass the whole position object
    const [position, setPosition] = useQueryState<PolymarketPosition>('position', parseAsPosition);
    const [action, setAction] = useQueryState('action', parseAsStringEnum([...Object.values(PositionAction)]));

    const isValidAction =
        position &&
        action &&
        ((action === PositionAction.CLAIM_PROCEEDS && position.isWin) ||
            (action === PositionAction.CLOSE_LOST_POSITION && !position.isWin));

    const clearParams = () => {
        setPosition(null);
        setAction(null);
    };

    return {
        position,
        action,
        isValidAction,
        clearParams,
    };
}
