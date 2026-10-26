// Liquid glass surface. Tone sets how much of the backdrop shows through:
// clear for decorative tiles, regular for content, solid where long text or forms must stay legible.
const tones = {
  clear: 'bg-white/25',
  regular: 'bg-white/40',
  solid: 'bg-white/60'
};

const material = [
  'isolate border border-white/60 shadow-glass backdrop-blur-2xl backdrop-saturate-[1.8]',
  // Users who ask the OS for less transparency get a near-opaque pane.
  '[@media(prefers-reduced-transparency:reduce)]:bg-white/92',
  // Static sheen: light falling on the top edge of the pane.
  'after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit]',
  'after:bg-linear-to-b after:from-white/50 after:via-white/0 after:via-45% after:to-white/10',
  // Signature move: a specular glint that follows the pointer across the glass (and the finger while pressed).
  'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit]',
  'before:bg-[radial-gradient(26rem_circle_at_var(--glint-x,50%)_var(--glint-y,-30%),rgb(255_255_255/0.6),transparent_55%)]',
  'before:opacity-0 before:transition-opacity before:duration-700 before:ease-out hover:before:opacity-100 active:before:opacity-100',
  'motion-reduce:before:hidden'
].join(' ');

// The pseudo-element layers need a positioned pane; keep `relative` unless the caller positions it.
const hasOwnPosition = (className) => /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);

const trackGlint = (event) => {
  const pane = event.currentTarget;
  const rect = pane.getBoundingClientRect();
  pane.style.setProperty('--glint-x', `${event.clientX - rect.left}px`);
  pane.style.setProperty('--glint-y', `${event.clientY - rect.top}px`);
};

const Glass = ({ as: Component = 'div', tone = 'regular', className = '', children, ...props }) => (
  <Component
    onPointerMove={trackGlint}
    onPointerDown={trackGlint}
    className={`${hasOwnPosition(className) ? '' : 'relative'} ${material} ${tones[tone]} ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export default Glass;
