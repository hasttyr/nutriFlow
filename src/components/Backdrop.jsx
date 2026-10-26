// Fixed scene behind every glass pane: produce colours the glass blurs and saturates.
// Fields are scaled per breakpoint so citrus and leaf never overlap into a muddy mix on phones.
const Backdrop = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ground">
    <div className="absolute -top-24 -left-28 size-80 rounded-full bg-citrus-400/75 blur-3xl sm:-top-40 sm:-left-32 sm:size-[40rem]" />
    <div className="absolute top-2/3 -right-28 size-80 rounded-full bg-leaf-400/65 blur-3xl sm:top-1/5 sm:-right-40 sm:size-[36rem]" />
    <div className="absolute top-1/3 -left-20 size-72 rounded-full bg-lemon-300/80 blur-3xl sm:top-auto sm:-bottom-48 sm:left-1/5 sm:size-[38rem]" />
    <div className="absolute -right-10 top-1/4 size-48 rounded-full bg-berry-400/40 blur-3xl sm:top-auto sm:right-1/4 sm:bottom-1/6 sm:size-72" />
  </div>
);

export default Backdrop;
