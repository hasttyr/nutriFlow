import { Activity, ArrowRightLeft } from 'lucide-react';
import { NODES, NODE_STATUSES, getNode, onlineCount, setNodeStatus } from '../distributed/cluster';
import { QUORUM } from '../distributed/orders';
import { useCluster } from '../distributed/hooks';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import StatusDot from '../ui/StatusDot';
import { pageHeading, sectionHeading } from '../ui/classes';

const LOG_ROWS = 15;

const modeClass = (active) =>
  `min-h-11 flex-1 cursor-pointer rounded-full px-3 text-sm font-semibold transition duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500 ${
    active ? 'bg-white/90 text-ink shadow-glass-sm' : 'text-ink/70 hover:text-ink'
  }`;

const SystemStatus = () => {
  const { t, localize, formatTime } = useLocale();
  const cluster = useCluster();
  const online = onlineCount(cluster);

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        <h1 className={`${pageHeading} mb-2`}>{t('status.title')}</h1>
        <p className="mb-6 max-w-3xl text-ink/75">{t('status.subtitle')}</p>

        <div className="mb-6 flex flex-wrap gap-3">
          <Glass className="flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-ink tabular-nums" data-testid="cluster-online">
            <Activity aria-hidden="true" className="size-5 text-citrus-700" />
            {t('status.online', { online, total: NODES.length })}
          </Glass>
          <Glass className="rounded-full px-4 py-2 font-semibold text-ink tabular-nums">
            {t('status.quorum', { quorum: QUORUM, total: NODES.length })}
          </Glass>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {NODES.map((node) => {
            const state = cluster.nodes[node.id];
            return (
              <Glass as="section" key={node.id} tone="solid" className="rounded-3xl p-5" aria-labelledby={`node-${node.id}`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 id={`node-${node.id}`} className="text-xl font-semibold tracking-tight text-ink">{node.name}</h2>
                    <p className="text-sm text-ink/65">{localize(node.zone)} · <span className="font-mono">{node.code}</span></p>
                  </div>
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink/80">
                    <StatusDot status={state.status} />
                    {t(`branch.status.${state.status}`)}
                  </span>
                </div>
                <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm tabular-nums">
                  <div>
                    <dt className="text-ink/65">{t('status.latency')}</dt>
                    <dd className="text-lg font-semibold text-ink">{state.status === 'offline' ? '—' : `${state.latency} ms`}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/65">{t('status.version')}</dt>
                    <dd className="text-lg font-semibold text-ink">v{state.version}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/65">{t('status.requests')}</dt>
                    <dd className="font-semibold text-ink">{state.requests}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/65">{t('status.failures')}</dt>
                    <dd className="font-semibold text-ink">{state.failures}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-ink/65">{t('status.heartbeat')}</dt>
                    <dd className="font-semibold text-ink">{formatTime(state.lastHeartbeat)}</dd>
                  </div>
                </dl>
                <div role="group" aria-label={t('status.simulate', { branch: node.name })} className="flex rounded-full bg-ink/8 p-0.5 ring-1 ring-white/50 ring-inset">
                  {NODE_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={state.status === status}
                      onClick={() => setNodeStatus(node.id, status)}
                      className={modeClass(state.status === status)}
                    >
                      {t(`status.mode.${status}`)}
                    </button>
                  ))}
                </div>
              </Glass>
            );
          })}
        </div>

        <Glass as="section" tone="solid" className="rounded-3xl p-5 sm:p-6" aria-labelledby="log-title">
          <h2 id="log-title" className={`${sectionHeading} mb-4`}>{t('status.log')}</h2>
          {cluster.log.length === 0 ? (
            <p className="text-ink/70">{t('status.logEmpty')}</p>
          ) : (
            <ol className="space-y-1.5" data-testid="call-log">
              {cluster.log.slice(0, LOG_ROWS).map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-xl bg-white/50 px-3 py-2 text-sm tabular-nums">
                  <span className="text-ink/60">{formatTime(entry.time)}</span>
                  <span className="font-semibold text-ink">{getNode(entry.nodeId).name}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-ink/80">
                    {entry.service}.{entry.op}
                  </span>
                  {entry.kind === 'failover' ? (
                    <span className="flex items-center gap-1 font-semibold text-amber-800">
                      <ArrowRightLeft aria-hidden="true" className="size-4" />
                      {t('status.failoverFrom', { from: getNode(entry.from).name })}
                    </span>
                  ) : (
                    <>
                      <span className="text-ink/60">{entry.ms} ms</span>
                      <span className={`font-semibold ${entry.ok ? 'text-leaf-700' : 'text-rose-700'}`}>
                        {entry.ok ? t('status.ok') : t('status.failed')}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Glass>
      </div>
    </div>
  );
};

export default SystemStatus;
