import { useState } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { fieldInput, fieldLabel, focusRing } from './classes';

const Hint = ({ id, children }) => <p id={id} className="mt-1.5 text-sm text-ink/65">{children}</p>;

// Labelled text input; an optional hint is announced along with the field.
export const Field = ({ id, label, hint, className = '', ...inputProps }) => (
  <div className={className}>
    <label htmlFor={id} className={fieldLabel}>{label}</label>
    <input id={id} name={id} aria-describedby={hint ? `${id}-hint` : undefined} className={fieldInput} {...inputProps} />
    {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
  </div>
);

// Password input with a show/hide toggle inside the field.
export const PasswordField = ({ id, label, hint, toggleLabel, className = '', ...inputProps }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className={fieldLabel}>{label}</label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${fieldInput} pr-12`}
          {...inputProps}
        />
        <button
          type="button"
          aria-label={toggleLabel}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className={`absolute inset-y-0 right-1 my-auto flex size-10 cursor-pointer items-center justify-center rounded-full text-ink/65 transition hover:bg-white/70 hover:text-ink ${focusRing}`}
        >
          {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
        </button>
      </div>
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
    </div>
  );
};

// Inline note for demo caveats and other side information.
export const Notice = ({ className = '', children }) => (
  <p className={`flex items-start gap-2 rounded-2xl bg-white/60 px-4 py-3 text-sm text-ink/80 ring-1 ring-white/80 ring-inset ${className}`}>
    <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-citrus-700" />
    {children}
  </p>
);
