import type { ProfileSource, SocialSource, SourceInURL } from '@/shared/src/constants/source.js';

export interface FireflyResponse<T> {
    code: number;
    data?: T;
    error?: string[];
}

export type ResponseJson<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          error: {
              code: number;
              message: string;
          };
      };

export type ResponseJsonRpc<T> = ResponseJson<{
    method: string;
    source: SourceInURL;
    result: T;
}>;

export interface FireflyChannel {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string;
}

export interface FireflyPost {
    id: string;
    postId: string;
    source: SocialSource;
    slug: string;
    author: FireflyProfile;
    metadata: {
        content: {
            content: string;
            attachments?: Array<{
                type: string;
                url: string;
                uri: string;
            }>;
        };
    };
}

export interface FireflyProfile {
    profileId: string;
    displayName: string;
    handle: string;
    profileSource: ProfileSource;
    source: SocialSource;
    fullHandle: string;
    pfp: string;
    bio?: string;
    followerCount: number;
    followingCount: number;
    status: 'active';
    verified: boolean;
}
