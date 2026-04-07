import FireflyLogo from '@dimensiondev/assets/firefly.logo.svg';

export function DefaultPendingComponent() {
    return (
        <div className="fixed inset-0 flex items-center justify-center">
            <FireflyLogo className="size-[150px] animate-pulse" />
        </div>
    );
}
