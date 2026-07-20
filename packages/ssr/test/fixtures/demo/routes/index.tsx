import { useLoaderData } from '@dimensiondev/ssr';

export function loader() {
    return { message: 'demo-works' };
}

export function head({ data }: { data: { message: string } }) {
    return { title: `Demo — ${data.message}` };
}

export default function Home() {
    const data = useLoaderData<{ message: string }>();
    return <h1>{data.message}</h1>;
}
