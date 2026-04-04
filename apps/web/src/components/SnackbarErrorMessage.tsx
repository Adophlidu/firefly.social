import { type ReactNode } from 'react';

interface SnackbarErrorMessage {
    title: ReactNode;
    message: ReactNode;
}

export function SnackbarErrorMessage(props: SnackbarErrorMessage) {
    return (
        <div>
            <span className="font-bold">{props.title}</span>
            <br />
            {props.message}
        </div>
    );
}
