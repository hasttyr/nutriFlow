import { useEffect } from 'react';
import { Link } from 'react-router';
import { Bell } from 'lucide-react';
import { useLive } from '../live/store';
import { inboxOf, markSeen, seenKey } from '../live/orders';
import { useSession } from '../live/session';
import { useLocale } from '../i18n/useLocale';
import { PageTitle, Panel } from '../components/LiveUi';
import { useNoteText } from '../live/useNoteText';
import { textLink } from '../ui/classes';

// The inbox of whoever uses this tab, in their language and time zone. Opening it marks it read.
const Notifications = () => {
  const { t } = useLocale();
  const live = useLive();
  const session = useSession();
  const noteText = useNoteText();
  const inbox = inboxOf(live, session);
  const key = seenKey(session);
  const latest = inbox[0]?.at;

  useEffect(() => {
    if (latest && (live.seen[key] ?? '') < latest) markSeen(key);
  }, [key, latest, live.seen]);

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-2xl">
        <PageTitle title={t('notify.title')} subtitle={t(`role.${session.role}`)} />
        <Panel>
          {inbox.length === 0 ? (
            <p className="flex items-center gap-3 text-ink/70"><Bell aria-hidden="true" className="size-5" />{t('notify.empty')}</p>
          ) : (
            <ul className="grid divide-y divide-ink/10" data-testid="inbox">
              {inbox.map((note) => {
                const { text, when } = noteText(note);
                return (
                  <li key={note.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-ink">{text}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-ink/60">
                      <time dateTime={note.at} className="tabular-nums">{when}</time>
                      {session.role === 'customer' && <Link to={`/orders/${note.orderId}`} className={textLink}>{t('orders.track')}</Link>}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default Notifications;
