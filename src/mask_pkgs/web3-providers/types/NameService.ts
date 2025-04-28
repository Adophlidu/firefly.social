import type { NameServiceID } from '@/constants/enum.js';

export namespace NameServiceAPI {
    export interface Provider {
        readonly id: NameServiceID;

        lookup(name: string): Promise<string | undefined>;
        reverse(address: string): Promise<string | undefined>;
    }
}
