import { useCallback } from 'react';

export function useSelectFiles() {
    const selectFiles = useCallback(async (accept?: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.hidden = true;
        if (accept) input.accept = accept;
        return new Promise<FileList>((resolve) => {
            input.addEventListener('input', function onInput(event) {
                const target = event.currentTarget as HTMLInputElement;
                resolve(target.files || new FileList());
                input.removeEventListener('input', onInput);
                document.body.removeChild(input);
            });
            input.click();
            document.body.append(input);
        });
    }, []);
    return selectFiles;
}
