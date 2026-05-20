import {
    FARCASTER_POLL_MINI_APP_URL,
    FARCASTER_POLL_MINI_APP_URL_DEV,
    FIREFLY_ROOT_URL,
    FIREFLY_ROOT_URL_DEV,
    FRAME_DEV_SERVER_URL,
    FRAME_SERVER_URL,
} from '@dimensiondev/constants/static';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';

export const settings = {
    get dev() {
        return envs.external.NEXT_PUBLIC_FIREFLY_DEV_API === STATUS.Enabled;
    },
    get FIREFLY_ROOT_URL() {
        return this.dev ? FIREFLY_ROOT_URL_DEV : FIREFLY_ROOT_URL;
    },
    get FRAME_SERVER_URL() {
        return this.dev ? FRAME_DEV_SERVER_URL : FRAME_SERVER_URL;
    },
    get POLL_MINI_APP_URL() {
        return this.dev ? FARCASTER_POLL_MINI_APP_URL_DEV : FARCASTER_POLL_MINI_APP_URL;
    },
};
