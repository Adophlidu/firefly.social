import { type PropsWithChildren, type ReactNode } from 'react';

export interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export interface LayoutProps<Params = never, SearchParams = never> extends PropsWithChildren {
    params: Params extends never ? never : Promise<Params>;
    searchParams: SearchParams extends never ? never : Promise<SearchParams>;
    children: ReactNode;
}

export interface NextPageProps<Params = never, SearchParams = never> extends PropsWithChildren {
    params: Params extends never ? never : Promise<Params>;
    searchParams: SearchParams extends never ? never : Promise<SearchParams>;
    children: ReactNode;
}

// learn more: https://nextjs.org/docs/app/api-reference/file-conventions/route#context-optional
export interface NextRequestContext<P = Record<string, string | undefined>> {
    params: Promise<P>;
}
