import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface RedPacketModalOpenProps {
    initialPath?: string;
}

export type RedPacketModalCloseProps = string | null | void;

export type RedPacketModalRefType = SingletonModalRefCreator<RedPacketModalOpenProps | void, RedPacketModalCloseProps>;

export const RedPacketModalRef = new SingletonModal<RedPacketModalOpenProps | void, RedPacketModalCloseProps>();
