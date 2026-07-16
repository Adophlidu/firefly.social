import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import { JoinClubLink } from '@/components/JoinClubLink.js';
import { resolveClubGatedMessage } from '@/helpers/resolveClubGatedMessage.js';

const CLUB_ADDRESS = '0x1234567890123456789012345678901234567890';

describe('resolveClubGatedMessage', () => {
    it('renders a JoinClubLink wired to the given club address', () => {
        const message = resolveClubGatedMessage(CLUB_ADDRESS);
        expect(isValidElement(message)).toBe(true);

        const children = (message as React.ReactElement<{ children: React.ReactNode[] }>).props.children;
        const joinLink = (children as React.ReactElement[]).find(
            (child) => isValidElement(child) && child.type === JoinClubLink,
        ) as React.ReactElement<{ clubAddress: string }> | undefined;

        expect(joinLink).toBeDefined();
        expect(joinLink?.props.clubAddress).toBe(CLUB_ADDRESS);
    });
});
