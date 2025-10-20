import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import {
    FARCASTER_POLL_MINI_APP_URL,
    FARCASTER_POLL_MINI_APP_URL_DEV,
    FIREFLY_DEV_ROOT_URL,
    FIREFLY_ROOT_URL,
    FRAME_DEV_SERVER_URL,
    FRAME_SERVER_URL,
} from '@/constants/index.js';

export const settings = {
    get dev() {
        return env.external.NEXT_PUBLIC_FIREFLY_DEV_API === STATUS.Enabled;
    },
    get FIREFLY_ROOT_URL() {
        return this.dev ? FIREFLY_DEV_ROOT_URL : FIREFLY_ROOT_URL;
    },
    get FRAME_SERVER_URL() {
        return this.dev ? FRAME_DEV_SERVER_URL : FRAME_SERVER_URL;
    },
    get POLL_MINI_APP_URL() {
        return this.dev ? FARCASTER_POLL_MINI_APP_URL_DEV : FARCASTER_POLL_MINI_APP_URL;
    },
};
