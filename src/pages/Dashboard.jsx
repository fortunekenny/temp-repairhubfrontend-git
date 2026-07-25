import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, ClipboardList, CalendarCheck, ShieldCheck, Wallet as WalletIcon,
  AlertTriangle, CheckCircle2, Clock, Users, Banknote, TrendingUp, Wrench,
} from 'lucide-react';
import api from '../api/client.js';
import { naira, formatDateTime, timeAgo } from '../lib/format.js';
import { Spinner, StatusBadge, EmptyState, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function StatCard({ icon: Icon, label, value, to, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  const body = (
    <div className="card flex items-center gap-4 p-4 transition hover:shadow-md sm:p-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

/* ---------------- Customer ---------------- */
function CustomerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/requests/mine'), api.get('/bookings/mine'), api.get('/warranties/mine')])
      .then(([r, b, w]) =>
        setData({ requests: r.data.requests, bookings: b.data.bookings, warranties: w.data.warranties })
      )
      .catch(() => setData({ requests: [], bookings: [], warranties: [] }));
  }, []);

  if (!data) return <Spinner />;

  const active = data.bookings.filter((b) => ['scheduled', 'in_progress'].includes(b.status));
  const openRequests = data.requests.filter((r) => r.status === 'open');

  return (
    <div>
      <PageHeader
        title={`Hi ${user.name.split(' ')[0]} 👋`}
        subtitle="Here's what's happening with your repairs."
        action={
          <Link to="/requests/new" className="btn-primary">
            <PlusCircle className="h-4 w-4" /> New repair request
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Open requests" value={openRequests.length} to="/requests" />
        <StatCard icon={CalendarCheck} label="Active repairs" value={active.length} to="/bookings" tone="amber" />
        <StatCard
          icon={CheckCircle2}
          label="Completed repairs"
          value={data.bookings.filter((b) => b.status === 'completed').length}
          to="/bookings"
          tone="emerald"
        />
        <StatCard icon={ShieldCheck} label="Warranties" value={data.warranties.length} to="/warranties" tone="violet" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold text-slate-900">Recent requests</h2>
          {data.requests.length === 0 ? (
            <EmptyState
              title="No repair requests yet"
              hint="Describe what's broken and get quotes from verified technicians near you."
              action={<Link to="/requests/new" className="btn-primary mt-2">Create your first request</Link>}
            />
          ) : (
            <div className="card divide-y divide-slate-100">
              {data.requests.slice(0, 5).map((r) => (
                <Link key={r.id} to={`/requests/${r.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.category_name} · {timeAgo(r.created_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-slate-900">Active bookings</h2>
          {active.length === 0 ? (
            <EmptyState title="No active bookings" hint="Accept a quotation on one of your requests to book a repair." />
          ) : (
            <div className="card divide-y divide-slate-100">
              {active.map((b) => (
                <Link key={b.id} to={`/bookings/${b.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{b.title}</p>
                    <p className="text-xs text-slate-500">
                      {b.technician_name} · {naira(b.quoted_amount)}
                      {b.scheduled_at && ` · ${formatDateTime(b.scheduled_at)}`}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------------- Technician ---------------- */
function TechnicianDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(undefined); // undefined=loading, null=none
  const [jobs, setJobs] = useState([]);
  const [available, setAvailable] = useState(null);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    api.get('/technicians/me')
      .then(({ data }) => setProfile(data.profile))
      .catch(() => setProfile(null));
    api.get('/bookings/mine').then(({ data }) => setJobs(data.bookings)).catch(() => {});
    api.get('/wallet').then(({ data }) => setWallet(data)).catch(() => {});
    api.get('/requests/available')
      .then(({ data }) => setAvailable(data.requests.length))
      .catch(() => setAvailable(null));
  }, []);

  if (profile === undefined) return <Spinner />;

  if (profile === null) {
    return (
      <EmptyState
        icon={Wrench}
        title="Set up your service profile"
        hint="Tell customers what you repair, where you work, and upload your ID for verification. You'll start receiving repair requests once an admin approves you."
        action={<Link to="/tech/profile" className="btn-primary mt-2">Create service profile</Link>}
      />
    );
  }

  const activeJobs = jobs.filter((b) => ['scheduled', 'in_progress'].includes(b.status));

  return (
    <div>
      <PageHeader title={`Hi ${user.name.split(' ')[0]} 👋`} subtitle="Your repair business at a glance." />

      {profile.verification_status === 'pending' && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Verification pending</p>
            <p>An admin is reviewing your profile. You'll be able to see and quote repair requests once approved.</p>
          </div>
        </div>
      )}
      {profile.verification_status === 'rejected' && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Verification rejected</p>
            <p>
              Update your profile details and ID document, then contact support.{' '}
              <Link to="/tech/profile" className="font-medium underline">Edit profile</Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Available requests" value={available ?? '—'} to="/tech/requests" />
        <StatCard icon={CalendarCheck} label="Active jobs" value={activeJobs.length} to="/bookings" tone="amber" />
        <StatCard
          icon={CheckCircle2}
          label="Jobs completed"
          value={jobs.filter((b) => b.status === 'completed').length}
          to="/bookings"
          tone="emerald"
        />
        <StatCard icon={WalletIcon} label="Wallet balance" value={wallet ? naira(wallet.balance) : '—'} to="/wallet" tone="violet" />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-slate-900">Active jobs</h2>
        {activeJobs.length === 0 ? (
          <EmptyState
            title="No active jobs"
            hint="Browse available repair requests in your area and submit quotations to win jobs."
            action={<Link to="/tech/requests" className="btn-primary mt-2">Browse available requests</Link>}
          />
        ) : (
          <div className="card divide-y divide-slate-100">
            {activeJobs.map((b) => (
              <Link key={b.id} to={`/bookings/${b.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{b.title}</p>
                  <p className="text-xs text-slate-500">
                    {b.customer_name} · {naira(b.quoted_amount)}
                    {b.scheduled_at && ` · ${formatDateTime(b.scheduled_at)}`}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------- Admin ---------------- */
function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setData(data)).catch(() => {});
  }, []);

  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeader title="Platform analytics" subtitle="RepairHub marketplace performance." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Customers" value={data.counts.customers} to="/admin/users" />
        <StatCard
          icon={Wrench}
          label="Technicians (approved / total)"
          value={`${data.counts.technicians_approved} / ${data.counts.technicians_total}`}
          to="/admin/technicians"
          tone="violet"
        />
        <StatCard icon={ClipboardList} label="Repair requests" value={data.counts.repair_requests} tone="amber" />
        <StatCard icon={CalendarCheck} label="Bookings" value={data.counts.bookings} tone="amber" />
        <StatCard icon={CheckCircle2} label="Jobs completed" value={data.counts.jobs_completed} tone="emerald" />
        <StatCard icon={TrendingUp} label="Gross revenue" value={naira(data.revenue.gross)} tone="emerald" />
        <StatCard icon={Banknote} label="Platform commission" value={naira(data.revenue.platform_commission)} tone="emerald" />
      </div>

      <section className="mt-8 max-w-lg">
        <h2 className="mb-3 font-semibold text-slate-900">Top repair categories</h2>
        {data.top_categories.length === 0 ? (
          <EmptyState title="No requests yet" />
        ) : (
          <div className="card divide-y divide-slate-100">
            {data.top_categories.map((c) => (
              <div key={c.name} className="flex items-center justify-between p-4">
                <span className="font-medium text-slate-800">{c.name}</span>
                <span className="text-sm text-slate-500">{c.requests} request{c.requests === 1 ? '' : 's'}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (user.role === 'technician') return <TechnicianDashboard />;
  if (user.role === 'admin') return <AdminDashboard />;
  return <CustomerDashboard />;
}
