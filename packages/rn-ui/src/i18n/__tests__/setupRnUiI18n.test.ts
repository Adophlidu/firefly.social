import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setupRnUiI18n, SUPPORTED_LOCALES } from '@/i18n';

describe('setupRnUiI18n', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('activates a known locale without warning', () => {
        const i18n = setupRnUiI18n('zh-Hans');
        expect(i18n.locale).toBe('zh-Hans');
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it.each(SUPPORTED_LOCALES)('activates supported locale %s', (locale) => {
        const i18n = setupRnUiI18n(locale);
        expect(i18n.locale).toBe(locale);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('falls back to en for an unknown locale AND warns in dev', () => {
        const i18n = setupRnUiI18n('fr');
        expect(i18n.locale).toBe('en');
        expect(warnSpy).toHaveBeenCalledTimes(1);
        const message = String(warnSpy.mock.calls[0][0]);
        expect(message).toContain('"fr"');
        expect(message).toContain('en');
    });

    it('falls back to en for undefined locale WITHOUT warning', () => {
        const i18n = setupRnUiI18n(undefined);
        expect(i18n.locale).toBe('en');
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('falls back to en for null locale WITHOUT warning', () => {
        const i18n = setupRnUiI18n(null);
        expect(i18n.locale).toBe('en');
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('falls back to en for empty string locale WITHOUT warning', () => {
        const i18n = setupRnUiI18n('');
        expect(i18n.locale).toBe('en');
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('returns fresh i18n instances on each call (so locale prop changes drive re-render)', () => {
        const a = setupRnUiI18n('en');
        const b = setupRnUiI18n('en');
        expect(a).not.toBe(b);
    });

    it('renders a known catalog string in the active locale', () => {
        const en = setupRnUiI18n('en');
        const zh = setupRnUiI18n('zh-Hans');
        // 'rn-ui.action.cancel' is in the ghost catalog: en="Cancel", zh-Hans="取消".
        expect(en._('rn-ui.action.cancel')).toBe('Cancel');
        expect(zh._('rn-ui.action.cancel')).toBe('取消');
    });

    it('falls back to the message ID when the catalog has no entry', () => {
        const en = setupRnUiI18n('en');
        // No such ID — Lingui returns the ID itself as fallback.
        expect(en._('rn-ui.does.not.exist')).toBe('rn-ui.does.not.exist');
    });
});
