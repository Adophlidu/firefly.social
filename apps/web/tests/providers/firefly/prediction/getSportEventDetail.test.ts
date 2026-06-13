import { Locale } from '@dimensiondev/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSportEventDetail } from '@/providers/firefly/prediction/getSportEventDetail.js';

// vi.hoisted makes fetchJsonMock available inside the hoisted vi.mock factories below.
const { fetchJsonMock } = vi.hoisted(() => ({ fetchJsonMock: vi.fn() }));

vi.mock('@/helpers/fetchJson.js', () => ({ fetchJson: (...args: unknown[]) => fetchJsonMock(...args) }));
vi.mock('@/helpers/resolveFireflyResponseData.js', () => ({ resolveFireflyResponseData: (r: unknown) => r }));
vi.mock('@/settings/index.js', () => ({ settings: { FIREFLY_ROOT_URL: 'https://test.local' } }));

/** The locale query param actually sent on the most recent fetchJson call. */
function lastLocaleParam(): string | null {
    const url = fetchJsonMock.mock.calls.at(-1)?.[0] as string;
    return new URL(url, 'https://test.local').searchParams.get('locale');
}

describe('getSportEventDetail — locale is passed through to the API', () => {
    beforeEach(() => {
        fetchJsonMock.mockReset();
        fetchJsonMock.mockResolvedValue({});
    });

    it.each([
        [Locale.zhHans, 'zh-Hans'],
        [Locale.zhHant, 'zh-Hant'],
        [Locale.es, 'es'],
        [Locale.ko, 'ko'],
        [Locale.ja, 'ja'],
        [Locale.en, 'en'],
    ])('sends locale %s as %s', async (locale, expected) => {
        await getSportEventDetail('fifwc-qat-che-2026-06-13', locale);
        expect(lastLocaleParam()).toBe(expected);
    });

    it('omits the locale param when none is provided', async () => {
        await getSportEventDetail('fifwc-qat-che-2026-06-13');
        expect(lastLocaleParam()).toBeNull();
    });

    it('keeps the slug on the request', async () => {
        await getSportEventDetail('fifwc-qat-che-2026-06-13', Locale.zhHans);
        const url = fetchJsonMock.mock.calls.at(-1)?.[0] as string;
        expect(new URL(url, 'https://test.local').searchParams.get('slug')).toBe('fifwc-qat-che-2026-06-13');
    });
});
