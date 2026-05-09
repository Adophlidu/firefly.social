import { ClientOnly, createFileRoute, Outlet } from '@tanstack/react-router';

import { PerpsProvider } from '@/components/Perps/PerpsProvider.js';

export const Route = createFileRoute('/perps')({
    component: PerpsLayout,
});

function PerpsLayout() {
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col">
            <ClientOnly>
                <PerpsProvider>
                    <Outlet />
                </PerpsProvider>
            </ClientOnly>
        </div>
    );
}
