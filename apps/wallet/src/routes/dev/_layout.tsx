import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/wallet';
import type { ReactNode } from 'react';

const devSiteEnabled = envs.external.NEXT_PUBLIC_DEV_SITE === STATUS.Enabled;

export default function DevLayout({ children }: { children?: ReactNode }) {
    // @dimensiondev/ssr has no notFound() primitive (was `throw notFound()` in
    // beforeLoad); when the dev site is disabled we render nothing instead.
    if (!devSiteEnabled) return null;
    return <>{children}</>;
}
