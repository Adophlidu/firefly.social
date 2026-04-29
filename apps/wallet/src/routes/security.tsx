import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/security')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Outlet />
        </div>
    );
}
