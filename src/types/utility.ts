// Utility types for improved type safety

// Replace any for better type safety
import type { ConnectorControllerState } from '@reown/appkit';
import type { PropsWithChildren, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';

import { ServerErrorCodes } from '@/helpers/createResponseJson.js';

// Non-nullable type
export type NonNullable<T> = T extends null | undefined ? never : T;

// Function parameter types
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

// https://github.com/microsoft/TypeScript/issues/29729#issuecomment-1483854699
export interface Nothing {}

export type LiteralUnion<U, T = U extends string ? string : U extends number ? number : never> = U | (T & Nothing);

export type LiteralOrString<T extends string> = T | Omit<string, T>;

export type NonUndefined<T> = T extends undefined ? never : T;

// learn more: https://nextjs.org/docs/app/api-reference/file-conventions/route#context-optional
export interface NextRequestContext<P = Record<string, string | undefined>> {
    params: Promise<P>;
}

export type Fetcher<T = Response> = (input: RequestInfo | URL, init?: RequestInit, next?: Fetcher) => Promise<T>;

export type Pluggable = NonNullable<Parameters<typeof ReactMarkdown>[0]['remarkPlugins']>[number];

export type ConnectorWithProvider = ConnectorControllerState['connectors'][0];
export type ChainNamespace = Required<ConnectorWithProvider>['connectors'][0]['chain'];

export type ResponseJson<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          error: {
              code: ServerErrorCodes;
              message: string;
          };
      };

export type SearchParams = Record<string, string | string[] | undefined>;

export type PartialWith<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export interface ClassType<T> extends Function {
    new (...args: unknown[]): T;
}

export interface NextPageProps<Params = never, SearchParams = never> extends PropsWithChildren {
    params: Params extends never ? never : Promise<Params>;
    searchParams: SearchParams extends never ? never : Promise<SearchParams>;
    children: ReactNode;
}
