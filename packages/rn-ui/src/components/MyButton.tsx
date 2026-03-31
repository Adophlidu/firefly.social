import { Button, styled, Text } from 'tamagui';

export const MyButton = styled(Button, {
    name: 'MyButton',
    backgroundColor: '$blue10',
    padding: '$4',
    borderRadius: '$4',
    hoverStyle: {
        backgroundColor: '$blue11',
    },
    pressStyle: {
        scale: 0.95,
    },
});

export const MyButtonText = styled(Text, {
    color: 'white',
    fontWeight: 'bold',
});
