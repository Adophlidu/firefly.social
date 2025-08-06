import { type OptionsObject, type SnackbarKey, type SnackbarMessage, useSnackbar } from 'notistack';

import { useSingletonModal } from '@/hooks/useSingletonModal.js';
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
type Props = {
    ref: React.Ref<SingletonModalRefCreator<SnackbarOpenProps, SnackbarCloseProps>>;
};

export function Snackbar({ ref }: Props) {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    useSingletonModal(ref, {
        onOpen: async (props) => {
            const withMessage = props as { message: SnackbarMessage; options?: OptionsObject };

            if ('message' in withMessage) enqueueSnackbar(withMessage.message, withMessage.options);
            else enqueueSnackbar(props as SnackbarMessage);
        },
        onClose: async (props) => {
            closeSnackbar(props.key);
        },
    });

    return null;
}

export const SnackbarRef = new SingletonModal<SnackbarOpenProps, SnackbarCloseProps>();
