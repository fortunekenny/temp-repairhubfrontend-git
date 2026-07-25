import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ClipboardList } from 'lucide-react';
import api from '../../api/client.js';
import { timeAgo } from '../../lib/format.js';
import { Spinner, EmptyState, StatusBadge, PageHeader } from '../../components/ui.jsx';

export default function MyRequests() {
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    api.get('/requests/mine').then(({ data }) => setRequests(data.requests)).catch(() => setRequests([]));
  }, []);

  if (!requests) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="My repair requests"
        subtitle="Track quotes and progress on everything you've posted."
        action={
          <Link to="/requests/new" className="btn-primary">
            <PlusCircle className="h-4 w-4" /> New request
          </Link>
        }
      />
      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing here yet"
          hint="Post your first repair request and get quotations from verified technicians."
          action={<Link to="/requests/new" className="btn-primary mt-2">Create a request</Link>}
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {requests.map((r) => (
            <Link key={r.id} to={`/requests/${r.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{r.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.category_name} · {r.address || 'No address'} · {timeAgo(r.created_at)}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
