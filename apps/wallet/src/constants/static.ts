import { STATUS } from '@dimensiondev/enums';

import { env } from '@/constants/env.js';

export const COINGECKO_ROOT_URL = 'https://coingecko-agent.r2d2.to/api/v3';
export const POLYMARKET_GAMMA_API_ROOT_URL = 'https://gamma-api.polymarket.com';
export const POLYMARKET_DATA_API_ROOT_URL = 'https://data-api.polymarket.com';
export const POLYMARKET_CLOB_API_ROOT_URL = 'https://clob.polymarket.com';
export const FIREFLY_STAMP_URL = 'https://stamp.firefly.land/avatar';
export const FIREFLY_STAMP_DEV_URL = 'https://stamp-dev.firefly.land/avatar';
export const FIREFLY_WORKER_HOST = 'https://firefly.r2d2.to';

export const APP_BASE_PATH = env.external.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '');
export const KLINE_BASE_URL = env.external.NEXT_PUBLIC_KLINE_BASE_URL.replace(/\/$/, '');

export const POAP_CONTRACT_ADDRESS = '0x22C1f6050E56d2876009903609a2cC3fEf83B415';

export const NFT_ENABLED = env.external.NEXT_PUBLIC_NFT_FEATURES === STATUS.Enabled;

// Minimum deposit amount in USD for bets
export const BET_DEPOSIT_MIN_USD = 1;

export const PRIVY_CONNECTOR_ID = 'firefly-backend-wallet';
