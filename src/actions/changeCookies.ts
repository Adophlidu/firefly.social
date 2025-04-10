'use server';

import { getEnumAsArray } from '@masknet/kit';
import { cookies } from 'next/headers.js';

import { Agent, Locale, PageRoute } from '@/constants/enum.js';
import { redirect } from '@/esm/navigation.js';

export async function changeCookies(formData: FormData) {
    const agent_ = formData.get('agent') as string | undefined;
    const locale_ = formData.get('locale') as string | undefined;
    const url_ = formData.get('url') as string | undefined;

    const isValidAgent = agent_ && getEnumAsArray(Agent).some(({ value }) => value === agent_);
    const isValidLocale = locale_ && getEnumAsArray(Locale).some(({ value }) => value === locale_);
    const isValidPageRoute = url_ && getEnumAsArray(PageRoute).some(({ value }) => value === url_);

    const agent = isValidAgent ? agent_ : null;
    const locale = isValidLocale ? locale_ : null;
    const url = isValidPageRoute ? url_ : PageRoute.Home;

    if (agent) (await cookies()).set('agent', agent);
    if (locale) (await cookies()).set('locale', locale);

    redirect(url);
}
