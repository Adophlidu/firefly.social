import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export type MyWalletsModalOpenProps = void;

export type MyWalletsModalCloseProps = void;

export type MyWalletsModalRefType = SingletonModalRefCreator;

export const MyWalletsModalRef = new SingletonModal<MyWalletsModalOpenProps, MyWalletsModalCloseProps>();
