// Shared Tailwind class sets for controls, so every page speaks the same glass vocabulary.

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500';

const pressable = `cursor-pointer transition duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 ${focusRing}`;

// Dark ink glass: the one primary action on a screen.
export const primaryButton = `inline-flex items-center justify-center gap-2 rounded-full bg-ink/90 px-6 py-3 font-semibold text-white shadow-ink backdrop-blur-xl hover:bg-ink ${pressable}`;

// Clear glass: secondary actions.
export const glassButton = `inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/45 px-6 py-3 font-semibold text-ink shadow-glass-sm backdrop-blur-xl backdrop-saturate-150 hover:bg-white/70 ${pressable}`;

// Round glass button for steppers and icon actions.
export const iconButton = `inline-flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/50 text-ink shadow-glass-sm backdrop-blur-xl hover:bg-white/80 ${pressable}`;

export const textLink = `rounded-full underline-offset-4 hover:underline ${focusRing}`;

export const calorieChip = 'inline-flex shrink-0 items-center whitespace-nowrap gap-1 rounded-full bg-citrus-100/85 px-3 py-1 text-sm font-semibold text-citrus-800 tabular-nums ring-1 ring-citrus-300/70 ring-inset';

export const fieldLabel = 'mb-1.5 block text-sm font-medium text-ink/80';

export const fieldInput = `w-full rounded-2xl border border-white/80 bg-white/60 px-4 py-2.5 text-ink shadow-[inset_0_1px_3px_rgb(19_32_26/0.1)] backdrop-blur-md transition placeholder:text-ink/65 hover:bg-white/70 focus:bg-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-citrus-500 user-invalid:ring-2 user-invalid:ring-rose-600`;

export const pageHeading = 'text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl';

export const sectionHeading = 'text-2xl font-semibold tracking-tight text-ink';
