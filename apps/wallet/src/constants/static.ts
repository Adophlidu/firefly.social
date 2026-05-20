import { STATUS } from '@dimensiondev/enums';

import { env } from '@/constants/env.js';

export const APP_BASE_PATH = env.external.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '');
export const KLINE_BASE_URL = env.external.NEXT_PUBLIC_KLINE_BASE_URL.replace(/\/$/, '');

export const NFT_ENABLED = env.external.NEXT_PUBLIC_NFT_FEATURES === STATUS.Enabled;
