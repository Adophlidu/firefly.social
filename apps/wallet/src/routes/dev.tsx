import { STATUS } from '@dimensiondev/enums';
import { env } from '@dimensiondev/envs/wallet';
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/dev')({
    beforeLoad: () => {
        if (env.external.NEXT_PUBLIC_DEV_SITE !== STATUS.Enabled) {
            throw notFound();
        }
    },
    component: DevLayout,
});

function DevLayout() {
    return <Outlet />;
}
