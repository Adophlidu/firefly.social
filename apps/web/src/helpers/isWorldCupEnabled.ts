import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';

export function isWorldCupEnabled() {
    return envs.external.NEXT_PUBLIC_WORLD_CUP === STATUS.Enabled;
}
