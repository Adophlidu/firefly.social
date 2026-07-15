import { describe, expect, test } from 'vitest';

import { formatDmUnreadCount } from '@/components/SideBar/formatDmUnreadCount.js';

describe('formatDmUnreadCount', () => {
    test('shows the exact count up to 99', () => {
        expect(formatDmUnreadCount(1)).toBe('1');
        expect(formatDmUnreadCount(99)).toBe('99');
    });

    test('caps counts above 99', () => {
        expect(formatDmUnreadCount(100)).toBe('99+');
    });
});
