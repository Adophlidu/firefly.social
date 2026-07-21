import { Link } from '#/esm/Link.js';

const CATEGORIES = [
    { name: 'Colors', href: '/colors', description: 'Theme tokens used across the Firefly product.' },
    { name: 'Buttons & Actions', href: '/buttons', description: 'Buttons, clickable areas, and copy/remove actions.' },
    { name: 'Overlays', href: '/overlays', description: 'Modals, popovers, tooltips, and menus.' },
    { name: 'Feedback', href: '/feedback', description: 'Loading states, snackbars, and empty states.' },
    { name: 'Media & Icons', href: '/media-icons', description: 'Avatars, token/chain icons, and source badges.' },
    { name: 'Form Controls', href: '/form-controls', description: 'Inputs, switches, time and date pickers.' },
    { name: 'Data Display', href: '/data-display', description: 'Token values, prices, timestamps, and badges.' },
    { name: 'Navigation', href: '/navigation', description: 'Tabs and inline links.' },
] as const;

export default function HomePage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-16">
            <h1 className="text-3xl font-bold">Component catalog</h1>
            <p className="mt-2 text-second">Reusable, presentational primitives from the Firefly design system.</p>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                {CATEGORIES.map((category) => (
                    <li key={category.name}>
                        <Link
                            href={category.href}
                            className="block rounded-2xl border border-line bg-bg px-5 py-4 transition-colors hover:border-fireflyBrand"
                        >
                            <p className="font-medium">{category.name}</p>
                            <p className="mt-1 text-sm text-second">{category.description}</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
