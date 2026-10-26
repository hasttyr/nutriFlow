// Fixed scene behind every glass pane: a fresh-produce photo the glass blurs and saturates,
// softened by a light wash so text on the panes stays legible.
const Backdrop = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ground">
    <img
      src="/images/backdrop-produce.jpg"
      alt=""
      className="size-full scale-125 object-cover"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-ground/65" />
  </div>
);

export default Backdrop;
