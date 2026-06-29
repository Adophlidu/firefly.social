import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { normalizeFifaBracketDto } from '@/helpers/prediction/category/bracket/normalizeFifaBracketDto.js';
import type { FifaBracketData } from '@/helpers/prediction/category/bracket/types.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { FifaBracketDataDto, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

/**
 * Single data-source seam for the FIFWC bracket: backend Firefly endpoint → snake_case DTO
 * → stable FifaBracketData. `locale` is intentionally NOT forwarded — the backend returns
 * English base names and the UI localizes via useLocalizedSportsTeamName (avoids double-translate).
 */
export async function getWorldCupBracket(): Promise<FifaBracketData> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/fifa/bracket');
    const response = await fetchJson<Response<FifaBracketDataDto>>(url, { method: 'GET' });
    const data = resolveFireflyResponseData(response);
    return normalizeFifaBracketDto(data);
}
