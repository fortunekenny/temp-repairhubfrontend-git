import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { timeAgo } from '../lib/format.js';
import { EmptyState, PageHeader } from '../components/ui.jsx';

const TYPE_ICONS = {
  new_request: '🛠️',
  quotation_received: '💬',
  quotation_accepted: '🤝',
  job_status: '🔧',
  warranty_issued: '🛡️',
  warranty_reminder: '🛡️',
  payment_confirmed: '💳',
  payment_released: '💰',
  payout: '🏦',
  review_received: '⭐',
  verification: '✅',
  appointment_reminder: '⏰',
};

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up.'}
        action={
          unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )
        }
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          hint="Quotes, booking updates, payments and reminders will appear here in real time."
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50 ${n.is_read ? 'opacity-70' : ''}`}
            >
              <span className="mt-0.5 text-xl">{TYPE_ICONS[n.type] || '🔔'}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm ${n.is_read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                    {n.title}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                </span>
                {n.body && <span className="mt-0.5 block text-sm text-slate-500">{n.body}</span>}
              </span>
              {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
