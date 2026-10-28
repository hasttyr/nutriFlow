import Glass from '../ui/Glass';

// Shared frame for the 404 and 500 control views: a large status code, the explanation,
// technical details in a quiet inset, and the ways out.
const ErrorView = ({ code, title, text, details, actions }) => (
  <div className="px-4 py-10 sm:py-16">
    <Glass tone="solid" className="container mx-auto max-w-xl rounded-3xl p-6 text-center sm:p-10">
      <p aria-hidden="true" className="bg-linear-to-b from-ink to-citrus-700 bg-clip-text text-8xl leading-none font-semibold tracking-tighter text-transparent tabular-nums sm:text-9xl">
        {code}
      </p>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance text-ink">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-pretty text-ink/75">{text}</p>
      {details && <div className="mt-6 rounded-2xl bg-white/55 p-4 text-left text-sm ring-1 ring-white/80 ring-inset">{details}</div>}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">{actions}</div>
    </Glass>
  </div>
);

export default ErrorView;
