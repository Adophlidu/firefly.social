import { notFound, redirect } from '@/esm/navigation/server.js';
import { resolveGroupPageUrl } from '@/helpers/resolveGroupPageUrl.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string }> {}

export default async function Page(props: Props) {
    const param = await props.params;

    if (!param.id) notFound();

    redirect(resolveGroupPageUrl(param.id));
}
