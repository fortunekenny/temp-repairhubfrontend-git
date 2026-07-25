import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import api from '../api/client.js';
import { naira, formatDateTime } from '../lib/format.js';
import { Spinner, EmptyState, StatusBadge, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FILTERS = ['all', 'scheduled', 'in_progress', 'completed', 'cancelled'];

export default function BookingsList() {
  const { user } = useAuth();
  const isTech = user.role === 'technician';
  const [bookings, setBookings] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/bookings/mine').then(({ data }) => setBookings(data.bookings)).catch(() => setBookings([]));
  }, []);

  if (!bookings) return <Spinner />;

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div>
      <PageHeader
        title={isTech ? 'My jobs' : 'My bookings'}
        subtitle={isTech ? 'Repairs you have been booked for.' : 'Repairs you have booked with technicians.'}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={filter === 'all' ? 'No bookings yet' : `No ${filter.replace('_', ' ')} bookings`}
          hint={
            isTech
              ? 'Quote on available repair requests — when a customer accepts, the job appears here.'
              : 'Accept a quotation on one of your repair requests to create a booking.'
          }
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {filtered.map((b) => (
            <Link key={b.id} to={`/bookings/${b.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{b.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {b.category_name} · {isTech ? `Customer: ${b.customer_name}` : `Technician: ${b.technician_name}`} ·{' '}
                  {naira(b.quoted_amount)}
                  {b.scheduled_at && ` · ${formatDateTime(b.scheduled_at)}`}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
