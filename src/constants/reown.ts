import { type ChainNamespace } from '@/types/utility.js';

// learn more: https://explorer.walletconnect.com/?type=wallet
export enum WalletId {
    // override particle wallet from EIP6963
    FireflyWallet = 'network.particle',

    CoinBase = 'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
    MetaMask = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    Rabby = '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1',
    OKX = '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709',
    Rainbow = '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',

    Zerion = 'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18',
    Phantom = 'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393',
    Binance = '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4',
    Solflare = '1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79',
    WalletConnect = 'walletconnect',

    Injected = 'injected',
    Unknown = 'unknown',
}

export const WalletChainConfig: Partial<Record<WalletId, ChainNamespace[]>> = {
    [WalletId.CoinBase]: ['eip155', 'solana'],
    [WalletId.Phantom]: ['eip155', 'solana'],
    [WalletId.OKX]: ['eip155', 'solana'],
    [WalletId.MetaMask]: ['eip155'],
    [WalletId.Rabby]: ['eip155'],
    [WalletId.Solflare]: ['solana'],
};

export const walletConnectId = 'walletConnect';
export const walletConnectIcon =
    'data:image/webp;base64,UklGRoQFAABXRUJQVlA4IHgFAAAQHwCdASp4AHgAPkkkjUSioiEVDGQYKASEsQBrTdi9V/GD8mflPpT9Q+7PEdo66nv5H8k/qfWK8wD+Afwn/AfxP+d9gDzAfar7wHoY/4vqAf6DqAOfE9iL+2/679o/Zd9QD//+oB//5lWRX6GuwHaY3eTHXFDyf94MY8zXvW3sC+Ux7Ff3I9lUnxBszMzMi+F8vttSqgutQquCB9o/6xQmMK42Q/WbdImEUpOqAd6u9h29GS1GgtbyEG2sDVzO4ZMHRCs1Z+SDbXLhIp6P3MCv8qbQY5kqbkHw1whDyDmZDXnO2N0BG0kh4OJlQEVeNeizP7fD34527u7u7u7u7u7sAAD+6Isf/94lW/WpT/f/+3OgFGaTgAAGDhlRYjGqZQcAAT9yh1vvJ8zrnfD5w65SpgvO8JdZndGf06eAg4abEWdwfNrhPidbW62baoeoW6QKe6Po6a3SfDgUxTkBiyfa6aQUtIUGi1uBLXPRARZxxk1RzVeP7tX4YVlU46ZT4F21rfa+L9KZhfgsVYoGdfucm3vMShtAjG1KrxQXIerWSCwntsXHunyedtYaZoKtyPde5PXpW7xpVP32KCdQU5pFOncjUdeC5f0rzo6/PnTKPTrdy16JvvX7zEKrr+WqEZb5hXukMwo6N8Ih6/Emwxd8FgnLe8b5Bnn7k/uM+szg3FzzTeXQeufvevm98uB2YZN/M5Yjadke6+6hxX9Yg6K84Ph+iAklF9vUUs3R38v6EYfsZZ6EyjnjxA+y+Bgr94Mgjuv9vmgfQkpNGC9xgu3TSWRVS0wC37go5DrovSTTs3E8ZiKPerDFKcBNvadynIfa6hFM3wvSQ0SodZsHlh7j6vPa+mtK2EuUN+I0VTKuwuGpPTIo/jrtfdXtSHgjEfm94ypk3Wor04YhlhPB766ggMJBtI4m9/Y6zTBgcG7c28W7SB5v8Vub8I3wuLcqJLP3kAaoVHwAoydvZojNzfsmP6MwbhR1Lr5tsZVH31IUEbg76DrQ+i2ZOTl9qCKDwiQhV5k35/DZGlQDNQg5gXrPDhFUBpIBmyhJize4Z13x54n2sf/RDdrj/51FBrl0d8sNmUeP7FeNGkz5/T7W0NEWBZwxHn2MhV02YkbceGkR583AW98Gvxj5OMHAgfNi39ttJOupfJ7/NOz8W/Z0k5d/sxuyfqQhs7yPDgqxdIWvW0493pAePUIxY0eW2x7bZxfF6l2CSpAuTZQ4/7F7nU0Jc5q2qruF453uW5aGcDv7hb73x1LFBj/w6PxrMjACi/3FWRhZACmvX8Ec5wdWI0K3QsCTSmc7bpk0f17rrgqv/U0iLrqrUuLOc9InkhsxB/5jVsTG37gbkbFFqZSyXBksIuJ0aKHo4MFkTr8N9Tg7d3RRRDNQHtpm+4eG9hpNK+fkJEoQ6Ne3VYoe8sg114BI9eVPqXK3xestyFZNeS16I2gewgFTLNcar8155bz4WSLgTGccxGOSbNv0d1zuTd5o8wdP7oEb4tnT+KMdnjrgVHcvhhUnHFeaFJLXUYdUKzgN37EDPajnygrfldc0NOoNj5Bamnxlq9EEDwGeLI5wJbXCYjOU4Dz5pbDtJsM2MgPQEUfMwRvocWG+DdXe6ETfjIX0H6zr0n3fasZGGmMqFCNZcVMctEx5+mqAG+JnWvd54aoOizkzCMhmYb14IcfiocgQ3KsD3gIC4rQV9E2XaUImdbfMpGF61/wqGvda6aRDxtHd1ncqrv43wQX3Fx21uN1knQwmrwi62tw4Wowsd5IbrPWsl1jMbRdwDkvscxEqzllnBxtHcAVIz5yzQ3NTCMmOkWVm77vmiJmqtx2MBoXs3Y6uVDgNkhNfu7Mvc3jMAAAAAAAAAA==';
