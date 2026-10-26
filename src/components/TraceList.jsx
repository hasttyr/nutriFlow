import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react';
import { getNode } from '../distributed/cluster';
import { useLocale } from '../i18n/useLocale';

const icons = {
  running: <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-citrus-600 motion-reduce:animate-none" />,
  ok: <CircleCheck aria-hidden="true" className="size-5 text-leaf-600" />,
  failed: <CircleX aria-hidden="true" className="size-5 text-rose-600" />
};

// The order's path through the cluster: one row per service hop, with the node and time it took.
const TraceList = ({ trace }) => {
  const { t } = useLocale();

  return (
    <ol className="space-y-2" data-testid="order-trace">
      {trace.map((step) => (
        <li key={step.id} className="flex items-center gap-3 rounded-2xl bg-white/55 px-4 py-2.5 ring-1 ring-white/80 ring-inset">
          {icons[step.status]}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{t(`service.${step.service}`)}</p>
            <p className="truncate font-mono text-xs text-ink/65">
              {step.service}
              {step.nodeId && `@${getNode(step.nodeId).id}`}
            </p>
          </div>
          <span className="text-sm whitespace-nowrap text-ink/70 tabular-nums">
            {step.status === 'running' && t('trace.running')}
            {step.status === 'failed' && t('trace.failed')}
            {step.status === 'ok' && step.ms !== undefined && `${step.ms} ms`}
          </span>
        </li>
      ))}
    </ol>
  );
};

export default TraceList;
