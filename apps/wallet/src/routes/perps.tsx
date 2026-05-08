import { ClientOnly, createFileRoute, Outlet } from '@tanstack/react-router';

import { PerpsProvider } from '@/components/Perps/PerpsProvider.js';

export const Route = createFileRoute('/perps')({
    component: PerpsLayout,
});

function PerpsLayout() {
    return (
        <div>
            <ClientOnly>
                <PerpsProvider>
                    <Outlet />
                </PerpsProvider>
            </ClientOnly>
        </div>
    );
}
