import type { SessionClient } from '@lens-protocol/client';

import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export interface AddLensManagerModalOpenProps {
    manager: string;
    profile: Profile;
    sessionClient?: SessionClient;
}

export type AddLensManagerModalCloseProps = boolean | void;

export type AddLensManagerModalRefType = SingletonModalRefCreator<
    AddLensManagerModalOpenProps,
    AddLensManagerModalCloseProps
>;

export const AddLensManagerModalRef = new SingletonModal<AddLensManagerModalOpenProps, AddLensManagerModalCloseProps>();
