import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type MintMetadata, type SponsorMintOptions } from '@/providers/types/Firefly.js';

export interface FreeMintModalOpenProps {
    mintTarget: SponsorMintOptions;
    mintParams: MintMetadata;
    onSuccess?: () => void;
}

export type FreeMintModalCloseProps = void;

export type FreeMintModalRefType = SingletonModalRefCreator<FreeMintModalOpenProps>;

export const FreeMintModalRef = new SingletonModal<FreeMintModalOpenProps, FreeMintModalCloseProps>();
