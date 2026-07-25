import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Clock3, BadgeCheck, XCircle, Hourglass } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { naira, formatDateTime, timeAgo } from '../../lib/format.js';
import { Spinner, EmptyState, StatusBadge, RatingStars, Modal, PageHeader } from '../../components/ui.jsx';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [quotations, setQuotations] = useState(null);
  const [accepting, setAccepting] = useState(null); // quotation being accepted
  const [scheduledAt, setScheduledAt] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, q] = await Promise.all([
        api.get(`/requests/${id}`),
        api.get(`/requests/${id}/quotations`),
      ]);
      setRequest(r.data.request);
      setQuotations(q.data.quotations);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load request'));
      navigate('/requests');
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
    // Refresh quotes every 20s while the request is open (new quotes arrive via socket toast too)
    const t = setInterval(() => load(), 20000);
    return () => clearInterval(t);
  }, [load]);

  async function acceptQuote() {
    setBusy(true);
    try {
      const payload = scheduledAt ? { scheduled_at: new Date(scheduledAt).toISOString() } : {};
      const { data } = await api.post(`/quotations/${accepting.id}/accept`, payload);
      toast.success('Booking created! The technician has been notified.');
      navigate(`/bookings/${data.booking.id}`);
    } catch (err) {
      toast.error(errMsg(err, 'Could not accept quotation'));
      setBusy(false);
      setAccepting(null);
      load();
    }
  }

  async function cancelRequest() {
    if (!window.confirm('Cancel this repair request? Technicians will no longer be able to quote.')) return;
    try {
      await api.patch(`/requests/${id}/cancel`);
      toast.success('Request cancelled');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  if (!request || !quotations) return <Spinner />;

  const pending = quotations.filter((q) => q.status === 'pending');
  const visibleQuotes = request.status === 'open' ? pending : quotations.filter((q) => q.status === 'accepted');

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/requests" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> My requests
      </Link>

      <PageHeader
        title={request.title}
        subtitle={`${request.category_name} · posted ${timeAgo(request.created_at)}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={request.status} />
            {request.status === 'open' && (
              <button onClick={cancelRequest} className="btn-danger !px-3 !py-1.5 text-xs">
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>
        }
      />

      <div className="card space-y-4 p-6">
        {request.description && <p className="text-slate-700">{request.description}</p>}
        {request.photos?.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {request.photos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" onError={(e) => (e.target.style.opacity = 0.3)} />
              </a>
            ))}
          </div>
        )}
        {request.address && (
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4" /> {request.address}
          </p>
        )}
      </div>

      {/* Quotations */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">
        {request.status === 'open' ? `Quotations (${pending.length})` : 'Accepted quotation'}
      </h2>

      {request.status === 'cancelled' ? (
        <EmptyState title="This request was cancelled" />
      ) : visibleQuotes.length === 0 ? (
        <EmptyState
          icon={Hourglass}
          title="Waiting for quotations…"
          hint="Verified technicians in your area have been notified. Quotes usually arrive shortly — you'll get a notification for each one. Cheapest appears first."
        />
      ) : (
        <div className="space-y-3">
          {request.status === 'open' && visibleQuotes.length > 1 && (
            <p className="text-sm text-slate-500">Sorted by price — compare ratings and timelines before choosing.</p>
          )}
          {visibleQuotes.map((q, idx) => (
            <div key={q.id} className={`card p-5 ${idx === 0 && request.status === 'open' ? 'ring-2 ring-emerald-500/30' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                    {q.technician_name}
                    <BadgeCheck className="h-4 w-4 text-blue-600" />
                  </p>
                  <RatingStars value={q.rating_avg} count={q.rating_count} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{naira(q.amount)}</p>
                  {idx === 0 && request.status === 'open' && visibleQuotes.length > 1 && (
                    <span className="text-xs font-medium text-emerald-600">Best price</span>
                  )}
                </div>
              </div>
              {q.message && <p className="mt-3 text-sm text-slate-600">“{q.message}”</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  {q.estimated_days ? `Estimated ${q.estimated_days} day${q.estimated_days > 1 ? 's' : ''}` : 'No time estimate'}
                </span>
                {request.status === 'open' ? (
                  <button onClick={() => setAccepting(q)} className="btn-success">
                    Accept & book
                  </button>
                ) : (
                  <StatusBadge status={q.status} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accept modal */}
      <Modal open={Boolean(accepting)} onClose={() => !busy && setAccepting(null)} title="Book this technician">
        {accepting && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              You're accepting <span className="font-semibold">{accepting.technician_name}</span>'s quote of{' '}
              <span className="font-semibold">{naira(accepting.amount)}</span>. All other quotes will be
              declined automatically.
            </p>
            <div>
              <label className="label" htmlFor="sched">Appointment date & time <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                id="sched"
                type="datetime-local"
                className="input"
                min={new Date().toISOString().slice(0, 16)}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">Both of you get a reminder 1 hour before the appointment.</p>
            </div>
            {scheduledAt && (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                Scheduled for <span className="font-medium">{formatDateTime(new Date(scheduledAt).toISOString())}</span>
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setAccepting(null)} disabled={busy} className="btn-secondary">
                Back
              </button>
              <button onClick={acceptQuote} disabled={busy} className="btn-success">
                {busy ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
