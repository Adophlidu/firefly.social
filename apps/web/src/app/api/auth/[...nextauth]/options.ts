/* cspell:disable */

import { envs, NODE_ENV } from '@dimensiondev/envs';
import type { AuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';

import { AppleProvider } from '@/esm/AppleProvider.js';
import { GoogleProvider } from '@/esm/GoogleProvider.js';
import { TwitterProvider } from '@/esm/TwitterProvider.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';

const providers: Provider[] = [
    TwitterProvider({
        id: 'twitter',
        clientId: envs.internal.TWITTER_CLIENT_ID,
        clientSecret: envs.internal.TWITTER_CLIENT_SECRET,
    }),
    AppleProvider({
        clientId: envs.internal.APPLE_CLIENT_ID,
        // will expire at 2025/5/9
        clientSecret: envs.internal.APPLE_CLIENT_SECRET,
        checks: 'nonce',
    }),
    GoogleProvider({
        clientId: envs.internal.GOOGLE_CLIENT_ID,
        clientSecret: envs.internal.GOOGLE_CLIENT_SECRET,
    }),
];

export const authOptions: AuthOptions = {
    debug: envs.shared.NODE_ENV === NODE_ENV.Development,
    providers,
    useSecureCookies: envs.shared.NODE_ENV === NODE_ENV.Production,
    cookies: {
        nonce: {
            name: 'next-auth.nonce',
            options: {
                httpOnly: true,
                sameSite: 'none',
                path: '/',
                secure: true,
            },
        },
        pkceCodeVerifier: {
            name: 'next-auth.pkce.code_verifier',
            options: {
                httpOnly: true,
                sameSite: 'none',
                path: '/',
                secure: true,
            },
        },
    },
    callbacks: {
        session: async (options) => {
            const { session, token } = options;

            return {
                ...session,
                type: token.type,
                user: {
                    ...session.user,
                    id: token.sub,
                },
                token: {
                    id_token: token.id_token,
                    nonce: token.nonce,
                    createdAt: token.iat,
                    expiresAt: token.exp,
                },
            };
        },
        jwt: async ({ token, account, session, ...rest }) => {
            if (account?.provider) {
                token.type = resolveSourceFromUrl(account.provider);
            }

            if (account?.provider && !token[account.provider]) {
                token[account.provider] = {};
            }

            // SECURITY WARNING: OAuth tokens are stored in JWT which is signed but not encrypted
            // Consider storing these server-side and only storing a reference in the JWT
            // For now, keeping this for backward compatibility but should be refactored
            if (account?.oauth_token && account?.oauth_token_secret) {
                token[account.provider] = {
                    oauthToken: account.oauth_token,
                    oauthTokenSecret: account.oauth_token_secret,
                };
            }

            if (account?.id_token) {
                token.id_token = account.id_token;
            }

            // @ts-expect-error
            if (rest.profile?.nonce) {
                // @ts-expect-error
                token.nonce = rest.profile.nonce;
            }

            return token;
        },
    },
};
