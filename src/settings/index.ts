import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FIREFLY_DEV_ROOT_URL, FIREFLY_ROOT_URL, FRAME_DEV_SERVER_URL, FRAME_SERVER_URL } from '@/constants/index.js';

function isDev() {
    return env.external.NEXT_PUBLIC_FIREFLY_DEV_API === STATUS.Enabled;
}

export const settings = {
    get FIREFLY_ROOT_URL() {
        return isDev() ? FIREFLY_DEV_ROOT_URL : FIREFLY_ROOT_URL;
    },
    get FRAME_SERVER_URL() {
        return isDev() ? FRAME_DEV_SERVER_URL : FRAME_SERVER_URL;
    },
};
