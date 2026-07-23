import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/perps')({
    component: PerpsLayout,
});

function PerpsLayout() {
    return (
        <div className="flex size-full min-h-0 flex-col overflow-hidden">
            <Outlet />
        </div>
    );
}
