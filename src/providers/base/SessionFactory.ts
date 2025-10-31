import { parseJson, parseUrl, safeUnreachable } from '@firefly/utils';
import { z } from 'zod';

import { UnreachableError } from '@/constants/error.js';
import { decodeAsciiPayload, decodeNoAsciiPayload } from '@/helpers/encodeSessionPayload.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { FireflySession, FireflySessionPayload, FireflySessionSignature } from '@/providers/firefly/Session.js';
import { LensSession } from '@/providers/lens/Session.js';
import { ThirdPartySession } from '@/providers/third-party/Session.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

const SessionSchema = z.object({
    profileId: z.string(),
    token: z.string(),
    createdAt: z.number().nonnegative(),
    expiresAt: z.number().nonnegative(),
});

const TwitterSessionPayloadSchema = z.object({
    clientId: z.string(),
    accessToken: z.string(),
    accessTokenSecret: z.string(),
    consumerKey: z.string(),
    consumerSecret: z.string(),
});

const ThirdPartySessionPayload = z.object({
    accessToken: z.string().optional(),
    accountId: z.string().optional(),
    isNew: z.boolean().optional(),
    uid: z.string().optional(),
    avatar: z.string().nullish().optional(),
    displayName: z.string().nullish().optional(),

    nonce: z.string().optional(),

    email: z.string().optional(),
    passcode: z.string().optional(),

    telegram_username: z.string().optional(),
    telegram_user_id: z.string().optional(),
});

const BskyDidDoc = z.object({
    service: z
        .array(
            z.object({
                id: z.string().optional(),
                type: z.string().optional(),
                serviceEndpoint: z.string().optional(),
            }),
        )
        .optional(),
});

const BskySessionPayload = z.object({
    refreshJwt: z.string(),
    accessJwt: z.string(),
    handle: z.string(),
    did: z.string(),
    didDoc: BskyDidDoc.optional(),
    email: z.string().optional(),
    emailConfirmed: z.boolean().optional(),
    emailAuthFactor: z.boolean().optional(),
    active: z.boolean(),
    status: z.string().optional(),
});

export class SessionFactory {
    /**
     * Creates a session instance based on the serialized session in string.
     *
     * @param serializedSession - The serialized session session in string.
     * @returns An instance of a session.
     */
    static createSession<T extends Session>(serializedSession: string): T {
        const fragments = serializedSession.split(':');
        const type = fragments[0] as SessionType;
        const json = atob(fragments[1]) as string;
        // for lens session, the second part is the refresh token
        // for farcaster session, the second part is the signer request token
        // for twitter session, the second part is payload in base64 encoded
        // for firefly session, the second part is the parent session in base64 encoded
        // for third party session, the second part is the payload in base64 encoded
        // for bsky session, the second part is the service url
        const secondPart = fragments[2] ?? '';
        // for lens session, the third part is the wallet address
        // for farcaster session, the third part is the channel token
        // for firefly session, the third part is the signature in base64 encoded
        // for bsky session, the third part is the atp session payload in base64 encoded
        const thirdPart = fragments[3] ?? '';
        // for farcaster session, the fourth part is the sponsorship signature
        // for firefly session, the fourth part is the isNew flag
        const fourthPart = fragments[4] ?? '';
        // for firefly session, the fifth part is the payload in base64 encoded
        const fifthPart = fragments[5] ?? '';

        const session = parseJson<{
            type: SessionType;
            profileId: string;
            token: string;
            createdAt: number;
            expiresAt: number;
        }>(json);
        if (!session) throw new Error('Failed to parse session.');

        const output = SessionSchema.safeParse(session);
        if (!output.success) {
            console.error([`[session factory] zod validation failure: ${output.error}`]);
            throw new Error('Malformed session.');
        }

        const createSessionFor = (type: SessionType): Session => {
            switch (type) {
                case SessionType.Farcaster:
                    return new FarcasterSession(
                        session.profileId,
                        session.token,
                        session.createdAt,
                        session.expiresAt,
                        secondPart, // signer request token
                        thirdPart, // channel token
                        fourthPart, // sponsorship signature
                    );
                case SessionType.Lens:
                    return new LensSession(
                        session.profileId,
                        session.token,
                        session.createdAt,
                        session.expiresAt,
                        secondPart, // refresh token
                        thirdPart, // wallet address
                    );
                case SessionType.Twitter: {
                    const parsed = TwitterSessionPayloadSchema.safeParse(decodeAsciiPayload(secondPart));
                    if (!parsed.success) throw new Error(parsed.error.message);
                    return new TwitterSession(
                        session.profileId,
                        session.token,
                        session.createdAt,
                        session.expiresAt,
                        parsed.data, // payload
                    );
                }
                case SessionType.Bsky: {
                    const u = parseUrl(atob(secondPart));
                    if (!u) throw new Error('Failed to parse service URL.');

                    const parsed = BskySessionPayload.safeParse(decodeAsciiPayload(thirdPart));
                    if (!parsed.success) throw new Error(parsed.error.message);

                    return new BskySession(
                        session.profileId,
                        session.createdAt,
                        session.expiresAt,
                        u.href,
                        parsed.data,
                    );
                }
                case SessionType.Firefly:
                    const parsed = FireflySessionPayload.safeParse(fifthPart ? decodeNoAsciiPayload(fifthPart) : {});
                    if (!parsed.success) throw new Error(parsed.error.message);
                    return new FireflySession(
                        session.profileId,
                        session.token,
                        secondPart ? SessionFactory.createSession(atob(secondPart)) : null, // parent session
                        thirdPart
                            ? (decodeAsciiPayload<z.infer<typeof FireflySessionSignature>>(thirdPart) ?? null)
                            : null, // signature
                        false, // @deprecated
                        {
                            ...parsed.data,
                            isNew: fourthPart === '1',
                        }, // payload
                    );
                case SessionType.Apple:
                case SessionType.Google:
                case SessionType.Email:
                case SessionType.Telegram: {
                    const parsed = ThirdPartySessionPayload.safeParse(decodeAsciiPayload(secondPart));
                    if (!parsed.success) throw new Error(parsed.error.message);

                    return new ThirdPartySession(
                        type,
                        session.profileId,
                        session.token,
                        session.createdAt,
                        session.expiresAt,
                        parsed.data, // payload
                    );
                }
                default:
                    safeUnreachable(type);
                    throw new UnreachableError('session type', type);
            }
        };

        return createSessionFor(type) as T;
    }
}
