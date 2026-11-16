import { useSyncExternalStore } from 'react';
import { getConnections, subscribeConnections } from '../live/remote';
import { useLocale } from '../i18n/useLocale';
import StatusDot from '../ui/StatusDot';

// Live mode: which regional server this tab is talking to. One country shows its instance (co-1,
// or co-2 in amber after a failover to the replica); the admin console counts the regions it hears.
const ServerBadge = () => {
  const { t } = useLocale();
  const connections = Object.entries(useSyncExternalStore(subscribeConnections, getConnections));
  const online = connections.filter(([, connection]) => connection.up).length;

  let status = 'offline';
  let text = t('server.down');
  let label = t('server.down');
  if (connections.length === 1) {
    const [country, connection] = connections[0];
    if (connection.up) {
      status = connection.instance.endsWith('-1') ? 'online' : 'slow';
      text = connection.instance;
      label = t('server.badgeLabel', { country, instance: connection.instance, host: new URL(connection.url).host });
    }
  } else if (connections.length > 1) {
    status = online === connections.length ? 'online' : online > 0 ? 'slow' : 'offline';
    text = t('server.regions', { online, total: connections.length });
    label = text;
  }

  return (
    <span title={label} className="flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-semibold text-ink/80 tabular-nums" data-testid="server-badge">
      <StatusDot status={status} />
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
};

export default ServerBadge;
