import { ChevronDown, MapPin, Server } from 'lucide-react';
import { NODES, getNode, setActiveNode } from '../distributed/cluster';
import { useCluster } from '../distributed/hooks';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import StatusDot from '../ui/StatusDot';

// Branch picker plus, when a request just ran, which node actually answered it.
const BranchBar = ({ source }) => {
  const { t } = useLocale();
  const { activeNodeId, nodes } = useCluster();
  const active = nodes[activeNodeId];

  return (
    <Glass className="mb-6 flex flex-col gap-2 rounded-3xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:py-2">
      <div className="flex min-w-0 items-center gap-3">
        <MapPin aria-hidden="true" className="size-5 shrink-0 text-citrus-700" />
        <label htmlFor="branch-picker" className="shrink-0 text-sm font-medium text-ink/80">{t('branch.label')}</label>
        {/* A native select is as wide as its longest option; let it shrink and clip on phones. */}
        <div className="relative min-w-0 flex-1 sm:flex-none">
          <select
            id="branch-picker"
            value={activeNodeId}
            onChange={(event) => setActiveNode(event.target.value)}
            className="min-h-11 w-full min-w-0 cursor-pointer appearance-none truncate rounded-full border border-white/80 bg-white/70 py-2 pr-10 pl-4 font-semibold text-ink shadow-glass-sm transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500"
          >
            {NODES.map((node) => (
              <option key={node.id} value={node.id}>
                {t('branch.option', {
                  name: node.name,
                  status: t(`branch.status.${nodes[node.id].status}`),
                  ms: nodes[node.id].latency
                })}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/70" />
        </div>
        <StatusDot status={active.status} />
      </div>
      {source && (
        <p className="flex items-center gap-1.5 text-sm text-ink/70" data-testid="data-source">
          <Server aria-hidden="true" className="size-4 shrink-0" />
          {source.failover
            ? t('source.failover', { branch: getNode(activeNodeId).name, replica: getNode(source.nodeId).name, ms: source.ms })
            : t('source.served', { branch: getNode(source.nodeId).name, ms: source.ms })}
        </p>
      )}
    </Glass>
  );
};

export default BranchBar;
