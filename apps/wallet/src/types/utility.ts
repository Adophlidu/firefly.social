import { type PropsWithChildren, type ReactNode } from 'react';

export interface NextPageProps<Params = never, SearchParams = never> extends PropsWithChildren {
    params: Params extends never ? never : Promise<Params>;
    searchParams: SearchParams extends never ? never : Promise<SearchParams>;
    children: ReactNode;
}
