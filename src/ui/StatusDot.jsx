const colors = {
  online: 'bg-leaf-600 shadow-[0_0_0_3px_rgb(93_191_124/0.3)]',
  slow: 'bg-amber-500 shadow-[0_0_0_3px_rgb(245_158_11/0.3)]',
  offline: 'bg-rose-600 shadow-[0_0_0_3px_rgb(225_29_72/0.25)]'
};

// Node health light. Always paired with a text label; colour alone never carries the state.
const StatusDot = ({ status }) => <span aria-hidden="true" className={`inline-block size-2.5 shrink-0 rounded-full ${colors[status]}`} />;

export default StatusDot;
