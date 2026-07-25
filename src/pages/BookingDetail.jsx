import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CalendarClock, CheckCircle2, CircleDot, CreditCard, ShieldCheck,
  Star, Wrench, User, Phone, BadgeCheck, ExternalLink,
} from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { naira, formatDateTime, formatDate } from '../lib/format.js';
import { Spinner, StatusBadge, Modal, PageHeader, RatingStars } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTech = user.role === 'technician';
  const isCustomer = user.role === 'customer';

  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  // technician: status update
  const [statusModal, setStatusModal] = useState(null); // 'in_progress' | 'completed'
  const [note, setNote] = useState('');
  // technician: warranty
  const [warrantyModal, setWarrantyModal] = useState(false);
  const [warrantyForm, setWarrantyForm] = useState({ duration_days: 30, terms: '' });
  // customer: payment + review
  const [payment, setPayment] = useState(null); // initialize response
  const [reviewModal, setReviewModal] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewed, setReviewed] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/bookings/${id}`);
      setData(data);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load booking'));
      navigate('/bookings');
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <Spinner />;
  const { booking, job_updates, warranty, payment: paid } = data;

  /* ---- technician actions ---- */
  async function updateStatus() {
    setBusy(true);
    try {
      await api.patch(`/bookings/${id}/status`, { status: statusModal, note: note.trim() || undefined });
      toast.success(statusModal === 'completed' ? 'Job marked as completed 🎉' : 'Repair started');
      setStatusModal(null);
      setNote('');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  async function issueWarranty() {
    setBusy(true);
    try {
      await api.post(`/bookings/${id}/warranty`, {
        duration_days: Number(warrantyForm.duration_days),
        terms: warrantyForm.terms.trim() || undefined,
      });
      toast.success('Warranty issued — the customer has been notified');
      setWarrantyModal(false);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  /* ---- customer actions ---- */
  async function startPayment() {
    setBusy(true);
    try {
      const { data } = await api.post(`/payments/bookings/${id}/initialize`);
      setPayment(data);
      window.open(data.authorization_url, '_blank', 'noopener');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  async function verifyPayment() {
    setBusy(true);
    try {
      await api.get(`/payments/verify/${payment.reference}`);
      toast.success('Payment confirmed — thank you!');
      setPayment(null);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Payment not confirmed yet'));
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    setBusy(true);
    try {
      await api.post(`/reviews/bookings/${id}`, {
        rating: review.rating,
        comment: review.comment.trim() || undefined,
      });
      toast.success('Review submitted — thanks for the feedback!');
      setReviewModal(false);
      setReviewed(true);
    } catch (err) {
      if (err.response?.status === 409) setReviewed(true);
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  /* ---- timeline ---- */
  const timeline = [
    { label: 'Booked', done: true, at: booking.created_at, note: booking.scheduled_at ? `Appointment: ${formatDateTime(booking.scheduled_at)}` : null },
    ...job_updates.map((u) => ({
      label: u.status === 'in_progress' ? 'Repair in progress' : 'Repair completed',
      done: true,
      at: u.created_at,
      note: u.note,
    })),
  ];
  if (booking.status === 'scheduled') timeline.push({ label: 'Repair in progress', done: false });
  if (booking.status !== 'completed' && booking.status !== 'cancelled') timeline.push({ label: 'Repair completed', done: false });
  timeline.push(
    warranty
      ? { label: 'Warranty issued', done: true, at: warranty.created_at, note: `${warranty.duration_days} days — expires ${formatDate(warranty.expires_at)}` }
      : { label: 'Warranty', done: false }
  );
  timeline.push(
    paid?.status === 'paid'
      ? { label: 'Payment confirmed', done: true, at: paid.paid_at, note: naira(paid.amount) }
      : { label: 'Payment', done: false }
  );

  const counterpart = isTech
    ? { icon: User, label: 'Customer', name: booking.customer_name }
    : { icon: Wrench, label: 'Technician', name: booking.technician_name, verified: true };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/bookings" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> {isTech ? 'My jobs' : 'My bookings'}
      </Link>

      <PageHeader
        title={booking.title}
        subtitle={`${booking.category_name || ''} · Booking #${booking.id}`}
        action={<StatusBadge status={booking.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: details + actions */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{counterpart.label}</p>
            <p className="flex items-center gap-1.5 font-semibold text-slate-900">
              <counterpart.icon className="h-4 w-4 text-slate-400" />
              {counterpart.name}
              {counterpart.verified && <BadgeCheck className="h-4 w-4 text-blue-600" />}
            </p>
            {booking.scheduled_at && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
                <CalendarClock className="h-4 w-4 text-slate-400" /> {formatDateTime(booking.scheduled_at)}
              </p>
            )}
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">Agreed price</p>
              <p className="text-2xl font-bold text-slate-900">{naira(booking.quoted_amount)}</p>
            </div>
          </div>

          {/* Technician actions */}
          {isTech && ['scheduled', 'in_progress'].includes(booking.status) && (
            <div className="card space-y-2 p-5">
              <p className="text-sm font-semibold text-slate-900">Update job status</p>
              {booking.status === 'scheduled' && (
                <button onClick={() => setStatusModal('in_progress')} className="btn-primary w-full">
                  <Wrench className="h-4 w-4" /> Start repair
                </button>
              )}
              <button onClick={() => setStatusModal('completed')} className="btn-success w-full">
                <CheckCircle2 className="h-4 w-4" /> Mark as completed
              </button>
            </div>
          )}
          {isTech && booking.status === 'completed' && !warranty && (
            <div className="card p-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">Issue a warranty</p>
              <p className="mb-3 text-xs text-slate-500">
                Warranties build trust and repeat customers. The customer gets a digital record.
              </p>
              <button onClick={() => setWarrantyModal(true)} className="btn-primary w-full">
                <ShieldCheck className="h-4 w-4" /> Issue warranty
              </button>
            </div>
          )}

          {/* Customer actions */}
          {isCustomer && booking.status === 'completed' && paid?.status !== 'paid' && (
            <div className="card p-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">Repair completed — time to pay</p>
              <p className="mb-3 text-xs text-slate-500">
                Pay securely through RepairHub. The technician is credited when payment is confirmed.
              </p>
              {!payment ? (
                <button onClick={startPayment} disabled={busy} className="btn-success w-full">
                  <CreditCard className="h-4 w-4" /> Pay {naira(booking.quoted_amount)}
                </button>
              ) : (
                <div className="space-y-2">
                  <a
                    href={payment.authorization_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary w-full"
                  >
                    <ExternalLink className="h-4 w-4" /> Open checkout page
                  </a>
                  <button onClick={verifyPayment} disabled={busy} className="btn-success w-full">
                    {busy ? 'Verifying…' : "I've paid — confirm payment"}
                  </button>
                  <p className="text-center text-xs text-slate-400">Ref: {payment.reference}</p>
                </div>
              )}
            </div>
          )}
          {isCustomer && booking.status === 'completed' && !reviewed && (
            <div className="card p-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">Rate your technician</p>
              <button onClick={() => setReviewModal(true)} className="btn-secondary w-full">
                <Star className="h-4 w-4" /> Leave a review
              </button>
            </div>
          )}
          {warranty && (
            <div className="card border-emerald-200 bg-emerald-50/50 p-5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                <ShieldCheck className="h-4 w-4" /> Warranty active
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                {warranty.duration_days} days · expires {formatDate(warranty.expires_at)}
              </p>
              {warranty.terms && <p className="mt-2 text-xs text-emerald-700/80">{warranty.terms}</p>}
            </div>
          )}
        </div>

        {/* Right: timeline */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-slate-900">Repair progress</h2>
            <ol className="space-y-1">
              {timeline.map((step, i) => (
                <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < timeline.length - 1 && (
                    <span className={`absolute left-[9px] top-6 h-full w-0.5 ${step.done ? 'bg-emerald-200' : 'bg-slate-200'}`} />
                  )}
                  {step.done ? (
                    <CheckCircle2 className="relative z-10 h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <CircleDot className="relative z-10 h-5 w-5 shrink-0 text-slate-300" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className={`text-sm font-medium ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                      {step.at && <span className="text-xs text-slate-400">{formatDateTime(step.at)}</span>}
                    </div>
                    {step.note && <p className="mt-0.5 text-sm text-slate-500">{step.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Status update modal */}
      <Modal
        open={Boolean(statusModal)}
        onClose={() => !busy && setStatusModal(null)}
        title={statusModal === 'completed' ? 'Mark repair as completed' : 'Start this repair'}
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="note">Progress note <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              id="note"
              rows={3}
              className="input"
              placeholder={statusModal === 'completed' ? 'e.g. Replaced screen and tested all functions' : 'e.g. Diagnosing the fault, parts ordered'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">The customer sees this note in their tracking timeline.</p>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setStatusModal(null)} disabled={busy} className="btn-secondary">Cancel</button>
            <button onClick={updateStatus} disabled={busy} className={statusModal === 'completed' ? 'btn-success' : 'btn-primary'}>
              {busy ? 'Saving…' : statusModal === 'completed' ? 'Complete job' : 'Start repair'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Warranty modal */}
      <Modal open={warrantyModal} onClose={() => !busy && setWarrantyModal(false)} title="Issue warranty">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="wdays">Warranty duration (days)</label>
            <input
              id="wdays"
              type="number"
              min={1}
              className="input"
              value={warrantyForm.duration_days}
              onChange={(e) => setWarrantyForm({ ...warrantyForm, duration_days: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="wterms">Terms <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              id="wterms"
              rows={3}
              className="input"
              placeholder="e.g. Covers the replaced screen. Physical/liquid damage not covered."
              value={warrantyForm.terms}
              onChange={(e) => setWarrantyForm({ ...warrantyForm, terms: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setWarrantyModal(false)} disabled={busy} className="btn-secondary">Cancel</button>
            <button onClick={issueWarranty} disabled={busy} className="btn-primary">
              {busy ? 'Issuing…' : 'Issue warranty'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Review modal */}
      <Modal open={reviewModal} onClose={() => !busy && setReviewModal(false)} title="Rate this repair">
        <div className="space-y-4">
          <div>
            <span className="label">Your rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setReview({ ...review, rating: i })} aria-label={`${i} stars`}>
                  <Star className={`h-8 w-8 transition ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200 hover:fill-amber-200 hover:text-amber-200'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="comment">Comment <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              id="comment"
              rows={3}
              className="input"
              placeholder="How was the service? Was the price fair? Would you recommend them?"
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setReviewModal(false)} disabled={busy} className="btn-secondary">Cancel</button>
            <button onClick={submitReview} disabled={busy} className="btn-primary">
              {busy ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
