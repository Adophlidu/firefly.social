import { type OptionsObject, type SnackbarKey, type SnackbarMessage } from '@/components/Snackbar.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export type SnackbarOpenProps =
    | {
          message: SnackbarMessage;
          options?: OptionsObject;
      }
    | SnackbarMessage;

export interface SnackbarCloseProps {
    key?: SnackbarKey;
}

export type SnackbarRefType = SingletonModalRefCreator<SnackbarOpenProps, SnackbarCloseProps>;

export const SnackbarRef = new SingletonModal<SnackbarOpenProps, SnackbarCloseProps>();
