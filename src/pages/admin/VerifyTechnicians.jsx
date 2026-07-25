import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BadgeCheck, XCircle, FileText, MapPin, Landmark, ShieldQuestion } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { formatDate } from '../../lib/format.js';
import { Spinner, EmptyState, StatusBadge, PageHeader, RatingStars } from '../../components/ui.jsx';

const TABS = ['pending', 'approved', 'rejected'];

export default function VerifyTechnicians() {
  const [status, setStatus] = useState('pending');
  const [techs, setTechs] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setTechs(null);
    try {
      const { data } = await api.get('/admin/technicians', { params: { status } });
      setTechs(data.technicians || data.profiles || []);
    } catch (err) {
      toast.error(errMsg(err));
      setTechs([]);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id, decision) {
    setBusyId(id);
    try {
      await api.patch(`/admin/technicians/${id}/verify`, { decision });
      toast.success(`Technician ${decision}`);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Technician verification"
        subtitle="Cross-check identity documents and bank account names before approving."
      />

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setStatus(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              status === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!techs ? (
        <Spinner />
      ) : techs.length === 0 ? (
        <EmptyState icon={ShieldQuestion} title={`No ${status} technicians`} />
      ) : (
        <div className="space-y-4">
          {techs.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.email}{t.phone ? ` · ${t.phone}` : ''}</p>
                  <div className="mt-1">
                    <RatingStars value={t.rating_avg} count={t.rating_count} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.verification_status} />
                  <span className="text-xs text-slate-400">since {formatDate(t.created_at)}</span>
                </div>
              </div>

              {t.bio && <p className="mt-3 text-sm text-slate-600">{t.bio}</p>}

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" /> {t.address || 'No address'} · {t.service_radius_km} km radius
                </span>
                {t.id_document_url ? (
                  <a href={t.id_document_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                    <FileText className="h-4 w-4" /> View ID document
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <FileText className="h-4 w-4" /> No ID document uploaded
                  </span>
                )}
                {t.account_name ? (
                  <span className="flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-slate-400" /> Bank name: <span className="font-medium">{t.account_name}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Landmark className="h-4 w-4" /> Bank not verified yet
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.categories?.map((c) => (
                  <span key={c.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {c.name}
                  </span>
                ))}
              </div>

              {t.verification_status === 'pending' && (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <button onClick={() => decide(t.id, 'approved')} disabled={busyId === t.id} className="btn-success">
                    <BadgeCheck className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => decide(t.id, 'rejected')} disabled={busyId === t.id} className="btn-danger">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
