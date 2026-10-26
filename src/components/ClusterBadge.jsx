import { Link } from 'react-router';
import { NODES, onlineCount } from '../distributed/cluster';
import { useCluster } from '../distributed/hooks';
import { useLocale } from '../i18n/useLocale';
import StatusDot from '../ui/StatusDot';

// Always-visible cluster health in the header; opens the status page.
const ClusterBadge = () => {
  const { t } = useLocale();
  const cluster = useCluster();
  const online = onlineCount(cluster);
  const total = NODES.length;
  const degraded = NODES.some((node) => cluster.nodes[node.id].status === 'slow');
  const status = online < total ? 'offline' : degraded ? 'slow' : 'online';

  return (
    <Link
      to="/status"
      aria-label={t('cluster.badgeLabel', { online, total })}
      className="flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-semibold text-ink/80 tabular-nums transition hover:bg-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500"
    >
      <StatusDot status={status} />
      <span className="sm:hidden">{online}/{total}</span>
      <span className="hidden sm:inline">{t('cluster.badge', { online, total })}</span>
    </Link>
  );
};

export default ClusterBadge;
