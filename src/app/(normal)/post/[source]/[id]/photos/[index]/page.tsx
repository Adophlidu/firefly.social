import { redirect } from 'next/navigation.js';
import urlcat from 'urlcat';

import type { SocialSourceInURL } from '@/constants/enum.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; index: string }, { source: SocialSourceInURL }> {}

export default async function Photo(props: Props) {
    const searchParams = await props.searchParams;
    const { source } = searchParams;
    const params = await props.params;
    const { id: postId } = params;

    redirect(urlcat('/post/:source/:id', { id: postId, source }));
}
