import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/swap')({
    component: SwapLayout,
});

function SwapLayout() {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Outlet />
        </div>
    );
}
