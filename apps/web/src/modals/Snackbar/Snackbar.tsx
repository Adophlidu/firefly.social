import { type OptionsObject, type SnackbarMessage, useSnackbar } from '@/components/Snackbar.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { type SnackbarRefType } from '@/modals/Snackbar/refs.js';

interface Props {
    ref: React.Ref<SnackbarRefType>;
}

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
