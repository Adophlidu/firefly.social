import { PageHeading } from '#/components/catalog/PageHeading.js';
import { Section } from '#/components/catalog/Section.js';
import { Swatch } from '#/components/catalog/Swatch.js';

export default function FormControlsPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-16">
            <PageHeading
                title="Form Controls"
                description="Static style reference only — no validation or form state wired up. Classes are copied from Switch/index.tsx, Form/FormInput.tsx, Form/ErrorMessage.tsx, TimePicker.tsx, and Calendar/DatePicker.tsx."
            />

            <Section title="Switch" description="bg-second (off) / data-[checked]:bg-highlight (on), in two sizes.">
                <Swatch label="medium, off">
                    <span className="inline-flex h-[22px] w-11 items-center rounded-full bg-second p-1">
                        <span className="size-4 rounded-full bg-white" />
                    </span>
                </Swatch>
                <Swatch label="medium, on">
                    <span className="inline-flex h-[22px] w-11 items-center justify-end rounded-full bg-highlight p-1">
                        <span className="size-4 rounded-full bg-white" />
                    </span>
                </Swatch>
                <Swatch label="small, on">
                    <span className="inline-flex h-[18px] w-8 items-center justify-end rounded-full bg-highlight p-0.5">
                        <span className="size-3.5 rounded-full bg-white" />
                    </span>
                </Swatch>
            </Section>

            <Section
                title="Form Input"
                description="h-12 rounded-2xl bg-bg — error state uses focus:shadow-inputDanger."
            >
                <Swatch label="default">
                    <input
                        readOnly
                        placeholder="Display name"
                        className="h-12 w-56 rounded-2xl border-none bg-bg px-4 text-main outline-none placeholder:text-second"
                    />
                </Swatch>
                <Swatch label="error">
                    <input
                        readOnly
                        defaultValue="taken-handle"
                        className="h-12 w-56 rounded-2xl border-none bg-bg px-4 text-main outline-none ring-2 ring-fail/50"
                    />
                </Swatch>
            </Section>

            <Section
                title="Error Message"
                description="text-xs font-medium leading-4 text-fail, shown beneath a field."
            >
                <p className="text-xs font-medium leading-4 text-fail">User Name is not available</p>
            </Section>

            <Section
                title="Time Picker"
                description="rounded-2xl border border-line bg-bgModal panel; selected cell is rounded bg-lightHighlight text-white."
            >
                <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-bgModal px-1 pt-2">
                    <div className="flex items-center justify-center gap-4 p-1">
                        <div className="flex flex-col gap-1">
                            {[10, 11, 12].map((h) => (
                                <div
                                    key={h}
                                    className={`flex h-8 w-12 items-center justify-center rounded text-sm ${h === 11 ? 'bg-lightHighlight text-white' : 'text-second'}`}
                                >
                                    {h}
                                </div>
                            ))}
                        </div>
                        <div className="h-32 w-px bg-line" />
                        <div className="flex flex-col gap-1">
                            {[5, 6, 7].map((m) => (
                                <div
                                    key={m}
                                    className={`flex h-8 w-12 items-center justify-center rounded text-sm ${m === 6 ? 'bg-lightHighlight text-white' : 'text-second'}`}
                                >
                                    0{m}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            <Section
                title="Date Picker"
                description="rounded-2xl border border-line bg-bgModal panel; selected day is bg-fireflyBrand text-white, allowed days get a border-second ring."
            >
                <div className="w-72 rounded-2xl border border-line bg-bgModal px-1.5 pt-1.5">
                    <div className="flex items-center justify-between">
                        <p className="pl-2 font-bold text-main">March 2026</p>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="text-sm font-bold text-third">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                    <th key={d} className="pb-1 font-bold">
                                        {d}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                    <td key={d} className="p-[5px] text-center">
                                        <span
                                            className={
                                                d === 4
                                                    ? 'flex size-[28px] items-center justify-center rounded-full !border-none bg-fireflyBrand text-sm leading-5 text-white'
                                                    : d === 6
                                                      ? 'flex size-[28px] items-center justify-center rounded-full border border-second text-sm leading-5 text-second'
                                                      : 'flex size-[28px] items-center justify-center rounded-full text-sm leading-5 text-second'
                                            }
                                        >
                                            {d}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Section>
        </main>
    );
}
