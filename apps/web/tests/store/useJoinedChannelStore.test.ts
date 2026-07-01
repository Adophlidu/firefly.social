/// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useHasJoinedChannel, useJoinedChannelStore } from '@/store/useJoinedChannelStore.js';

const PROFILE = '0xprofile';
const CLUB = '0xAbCd0000000000000000000000000000000000EF';

describe('useJoinedChannelStore', () => {
    beforeEach(() => {
        useJoinedChannelStore.setState({ joined: {} });
    });

    it('records and clears membership per profile + channel', () => {
        const { markJoined, markLeft, hasJoined } = useJoinedChannelStore.getState();

        expect(hasJoined(PROFILE, CLUB)).toBe(false);

        markJoined(PROFILE, CLUB);
        expect(useJoinedChannelStore.getState().hasJoined(PROFILE, CLUB)).toBe(true);

        markLeft(PROFILE, CLUB);
        expect(useJoinedChannelStore.getState().hasJoined(PROFILE, CLUB)).toBe(false);
    });

    it('matches the channel address case-insensitively', () => {
        useJoinedChannelStore.getState().markJoined(PROFILE, CLUB);
        expect(useJoinedChannelStore.getState().hasJoined(PROFILE, CLUB.toLowerCase())).toBe(true);
        expect(useJoinedChannelStore.getState().hasJoined(PROFILE, CLUB.toUpperCase())).toBe(true);
    });

    it('scopes membership to the acting profile', () => {
        useJoinedChannelStore.getState().markJoined(PROFILE, CLUB);
        expect(useJoinedChannelStore.getState().hasJoined('0xother', CLUB)).toBe(false);
    });

    it('treats missing profile or channel as not joined', () => {
        const { hasJoined } = useJoinedChannelStore.getState();
        expect(hasJoined(undefined, CLUB)).toBe(false);
        expect(hasJoined(PROFILE, undefined)).toBe(false);
    });

    it('useHasJoinedChannel reacts to store updates', () => {
        const { result } = renderHook(() => useHasJoinedChannel(PROFILE, CLUB));
        expect(result.current).toBe(false);

        act(() => useJoinedChannelStore.getState().markJoined(PROFILE, CLUB));
        expect(result.current).toBe(true);

        act(() => useJoinedChannelStore.getState().markLeft(PROFILE, CLUB));
        expect(result.current).toBe(false);
    });
});
