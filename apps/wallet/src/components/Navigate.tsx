import { useNavigate } from '@dimensiondev/ssr';
import { useEffect } from 'react';

/**
 * Client-side redirect. Replaces TanStack Router's `<Navigate>`: renders
 * nothing and navigates on mount.
 */
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(to, { replace });
    }, [navigate, to, replace]);
    return null;
}
