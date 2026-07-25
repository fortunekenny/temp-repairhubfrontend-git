import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, RefreshCw, Inbox, Clock } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { naira, timeAgo } from '../../lib/format.js';
import { Spinner, EmptyState, Modal, PageHeader } from '../../components/ui.jsx';

export default function AvailableRequests() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState(null);
  const [quoting, setQuoting] = useState(null); // request being quoted
  const [quote, setQuote] = useState({ amount: '', message: '', estimated_days: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/requests/available');
      setRequests(data.requests);
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response.data?.error || 'Your profile must be approved before you can see requests.');
      } else {
        setError(errMsg(err));
      }
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitQuote() {
    if (!quote.amount || Number(quote.amount) <= 0) return toast.error('Enter a valid amount');
    setBusy(true);
    try {
      await api.post(`/requests/${quoting.id}/quotations`, {
        amount: Number(quote.amount),
        message: quote.message.trim() || undefined,
        estimated_days: quote.estimated_days ? Number(quote.estimated_days) : undefined,
      });
      toast.success('Quotation sent — the customer has been notified');
      setQuoting(null);
      setQuote({ amount: '', message: '', estimated_days: '' });
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not submit quotation'));
    } finally {
      setBusy(false);
    }
  }

  if (!requests) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Available repair requests"
        subtitle="Open requests in your categories, within your service radius. Quote fast — customers compare."
        action={
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      {error ? (
        <EmptyState
          icon={Clock}
          title="Not available yet"
          hint={error}
          action={<Link to="/tech/profile" className="btn-secondary mt-2">Check my profile</Link>}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No open requests right now"
          hint="You'll get a notification the moment a customer posts a request in your categories and area."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {requests.map((r) => (
            <div key={r.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{r.title}</p>
                {r.distance_km != null && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {Number(r.distance_km).toFixed(1)} km
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {r.category_name} · posted {timeAgo(r.created_at)}
              </p>
              {r.description && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{r.description}</p>}
              {r.photos?.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.photos.slice(0, 4).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-14 w-14 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                      <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => (e.target.style.opacity = 0.3)} />
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{r.address || 'No address'}</span>
                </span>
                <button onClick={() => setQuoting(r)} className="btn-primary shrink-0 !px-3 !py-1.5 text-xs">
                  Send quotation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote modal */}
      <Modal open={Boolean(quoting)} onClose={() => !busy && setQuoting(null)} title={`Quote: ${quoting?.title || ''}`}>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="amount">Your price (₦)</label>
            <input
              id="amount"
              type="number"
              min={1}
              className="input"
              placeholder="e.g. 35000"
              value={quote.amount}
              onChange={(e) => setQuote({ ...quote, amount: e.target.value })}
            />
            {quote.amount > 0 && <p className="mt-1 text-xs text-slate-500">You're quoting {naira(quote.amount)}</p>}
          </div>
          <div>
            <label className="label" htmlFor="days">Estimated days</label>
            <input
              id="days"
              type="number"
              min={1}
              className="input"
              placeholder="e.g. 1"
              value={quote.estimated_days}
              onChange={(e) => setQuote({ ...quote, estimated_days: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="qmsg">Message to the customer</label>
            <textarea
              id="qmsg"
              rows={3}
              className="input"
              placeholder="e.g. Original screen, same-day fix, includes 30-day warranty"
              value={quote.message}
              onChange={(e) => setQuote({ ...quote, message: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-500">Explain what's included — customers pick on trust, not just price.</p>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setQuoting(null)} disabled={busy} className="btn-secondary">Cancel</button>
            <button onClick={submitQuote} disabled={busy} className="btn-primary">
              {busy ? 'Sending…' : 'Send quotation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
