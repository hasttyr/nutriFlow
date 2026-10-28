import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import Glass from './Glass';
import { focusRing } from './classes';

const GAP = 8;
const EDGE = 16;

// Select-only combobox (WAI-ARIA APG pattern) dressed in the app's glass. A native <select> opens
// an OS-drawn list that CSS cannot reach. Here focus stays on the trigger while the keyboard moves an
// active option, and the list renders in a portal so no card or blurred pane clips or dims it.
// Options are { value, label, content?, lang? }: label is plain text (typeahead), content the rich row.
const GlassSelect = ({ value, options, onChange, label, labelledBy, align = 'start', className = '', children }) => {
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (index) => `${id}-option-${index}`;
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const typed = useRef({ text: '', timer: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const last = options.length - 1;

  const show = (index = selectedIndex) => {
    setActive(index);
    setOpen(true);
  };
  const choose = (index) => {
    onChange(options[index].value);
    setOpen(false);
  };

  // Pin the list under the trigger, kept inside the viewport, and follow it on scroll and resize.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const list = listRef.current;
      const viewport = document.documentElement.clientWidth;
      list.style.top = `${rect.bottom + GAP}px`;
      list.style.minWidth = `${rect.width}px`;
      list.style.maxHeight = `${Math.max(160, window.innerHeight - rect.bottom - GAP - EDGE)}px`;
      const left = align === 'end' ? rect.right - list.offsetWidth : rect.left;
      list.style.left = `${Math.max(EDGE, Math.min(left, viewport - EDGE - list.offsetWidth))}px`;
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!triggerRef.current.contains(event.target) && !listRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' });
  });

  // Typing letters jumps to the first option that starts with them, like a native select.
  const jumpTo = (key) => {
    clearTimeout(typed.current.timer);
    typed.current.text += key.toLowerCase();
    typed.current.timer = setTimeout(() => (typed.current.text = ''), 500);
    const match = options.findIndex((option) => option.label.toLowerCase().startsWith(typed.current.text));
    if (match >= 0) show(match);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Tab') {
      if (open) choose(active);
      return;
    }
    const actions = {
      ArrowDown: () => (open && !event.altKey ? setActive(Math.min(active + 1, last)) : show()),
      ArrowUp: () => (open ? (event.altKey ? choose(active) : setActive(Math.max(active - 1, 0))) : show()),
      Home: () => show(0),
      End: () => show(last),
      PageDown: () => show(Math.min(active + 5, last)),
      PageUp: () => show(Math.max(active - 5, 0)),
      Enter: () => (open ? choose(active) : show()),
      ' ': () => (open ? choose(active) : show()),
      Escape: open ? () => setOpen(false) : undefined
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      jumpTo(event.key);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        role="combobox"
        tabIndex={0}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`cursor-pointer select-none ${focusRing} ${className}`}
      >
        {children}
      </div>
      {open &&
        createPortal(
          <Glass
            as="ul"
            ref={listRef}
            id={listId}
            role="listbox"
            tone="solid"
            aria-label={label}
            aria-labelledby={labelledBy}
            // Keep focus on the trigger when an option is clicked.
            onMouseDown={(event) => event.preventDefault()}
            className={`fixed z-60 flex w-max max-w-[calc(100vw-2rem)] flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-3xl p-1.5 text-ink transition duration-150 ease-out starting:scale-95 starting:opacity-0 motion-reduce:transition-none ${
              align === 'end' ? 'origin-top-right' : 'origin-top-left'
            }`}
          >
            {options.map((option, index) => {
              const selected = index === selectedIndex;
              return (
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={selected}
                  lang={option.lang}
                  onPointerMove={() => index !== active && setActive(index)}
                  onClick={() => choose(index)}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors duration-150 ${
                    index === active ? 'bg-white/85 shadow-glass-sm' : ''
                  } ${selected ? 'font-semibold' : 'font-medium text-ink/85'}`}
                >
                  <span className="min-w-0 flex-1">{option.content ?? option.label}</span>
                  <Check aria-hidden="true" className={`size-4 shrink-0 text-citrus-600 ${selected ? '' : 'invisible'}`} strokeWidth={2.5} />
                </li>
              );
            })}
          </Glass>,
          document.body
        )}
    </>
  );
};

export default GlassSelect;
