// Utility types for improved type safety

// Replace any for better type safety
import type { ServerErrorCodes } from '@dimensiondev/enums';
import type { ConnectorControllerState } from '@reown/appkit';
import type ReactMarkdown from 'react-markdown';

// Non-nullable type
type NonNullable<T> = T extends null | undefined ? never : T;

// Function parameter types
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

// https://github.com/microsoft/TypeScript/issues/29729#issuecomment-1483854699
interface Nothing {}

export type LiteralUnion<U, T = U extends string ? string : U extends number ? number : never> = U | (T & Nothing);

export type LiteralOrString<T extends string> = T | Omit<string, T>;

export type NonUndefined<T> = T extends undefined ? never : T;

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

export type PartialWith<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export interface ClassType<T> extends Function {
    new (...args: unknown[]): T;
}
