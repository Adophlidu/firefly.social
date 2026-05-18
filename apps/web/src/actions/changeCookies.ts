'use server';
import { Agent, Locale } from '@dimensiondev/enums';
import { isValidEnumValue } from '@dimensiondev/utils';
import { cookies } from 'next/headers.js';

import { setupAndActiveI18n } from '@/i18n/index.js';

export async function changeCookies(formData: FormData) {
    const agent_ = formData.get('agent') as string | undefined;
    const locale_ = formData.get('locale') as string | undefined;

    const isValidAgent = agent_ && isValidEnumValue(agent_, Agent);
    const isValidLocale = locale_ && isValidEnumValue(locale_, Locale);

    const agent = isValidAgent ? agent_ : null;
    const locale = isValidLocale ? locale_ : null;

    if (agent) (await cookies()).set('agent', agent);
    if (locale) {
        await cookies().then((c) => {
            c.set('locale', locale);
            setupAndActiveI18n(locale as Locale);
        });
    }
}
