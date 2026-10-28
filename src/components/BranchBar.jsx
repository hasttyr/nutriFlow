import { ChevronDown, MapPin, Server } from 'lucide-react';
import { NODES, getNode, setActiveNode } from '../distributed/cluster';
import { useCluster } from '../distributed/hooks';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import GlassSelect from '../ui/GlassSelect';
import StatusDot from '../ui/StatusDot';

// Branch picker plus, when a request just ran, which node actually answered it.
const BranchBar = ({ source }) => {
  const { t } = useLocale();
  const { activeNodeId, nodes } = useCluster();
  const active = nodes[activeNodeId];
  const activeNode = getNode(activeNodeId);

  const options = NODES.map((node) => ({
    value: node.id,
    label: node.name,
    content: (
      <span className="flex items-center gap-2.5">
        <StatusDot status={nodes[node.id].status} />
        <span>
          {node.name}
          {/* Screen readers would otherwise run the name into the status ("KennedySlow"). */}
          <span className="sr-only">, </span>
        </span>
        <span className="ml-auto pl-4 font-normal text-ink/65 tabular-nums">
          {t(`branch.status.${nodes[node.id].status}`)} · {nodes[node.id].latency} ms
        </span>
      </span>
    )
  }));

  return (
    <Glass className="mb-6 flex flex-col gap-2 rounded-3xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:py-2">
      <div className="flex min-w-0 items-center gap-3">
        <MapPin aria-hidden="true" className="size-5 shrink-0 text-citrus-700" />
        <span id="branch-label" className="shrink-0 text-sm font-medium text-ink/80">{t('branch.label')}</span>
        {/* The trigger can shrink and clip on phones; the list always shows each branch in full. */}
        <GlassSelect
          value={activeNodeId}
          options={options}
          onChange={setActiveNode}
          labelledBy="branch-label"
          className="relative flex min-h-11 min-w-0 flex-1 items-center rounded-full border border-white/80 bg-white/70 py-2 pr-10 pl-4 font-semibold text-ink shadow-glass-sm transition hover:bg-white/90 aria-expanded:bg-white/90 sm:flex-none"
        >
          <span className="truncate">{t('branch.option', { name: activeNode.name, status: t(`branch.status.${active.status}`), ms: active.latency })}</span>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/70 transition-transform duration-200 in-aria-expanded:rotate-180" />
        </GlassSelect>
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
