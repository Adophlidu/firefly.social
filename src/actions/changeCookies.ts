'use server';

import { getEnumAsArray } from '@masknet/kit';
import { cookies } from 'next/headers.js';

import { Agent, Locale } from '@/constants/enum.js';

export async function changeCookies(formData: FormData) {
    const agent_ = formData.get('agent') as string | undefined;
    const locale_ = formData.get('locale') as string | undefined;

    const isValidAgent = agent_ && getEnumAsArray(Agent).some(({ value }) => value === agent_);
    const isValidLocale = locale_ && getEnumAsArray(Locale).some(({ value }) => value === locale_);

    const agent = isValidAgent ? agent_ : null;
    const locale = isValidLocale ? locale_ : null;

    if (agent) (await cookies()).set('agent', agent);
    if (locale) (await cookies()).set('locale', locale);
}
