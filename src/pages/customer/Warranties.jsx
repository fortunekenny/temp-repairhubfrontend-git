import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '../../api/client.js';
import { formatDate } from '../../lib/format.js';
import { Spinner, EmptyState, PageHeader } from '../../components/ui.jsx';

export default function Warranties() {
  const [warranties, setWarranties] = useState(null);

  useEffect(() => {
    api.get('/warranties/mine').then(({ data }) => setWarranties(data.warranties)).catch(() => setWarranties([]));
  }, []);

  if (!warranties) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Repair history & warranties"
        subtitle="Digital warranty records for your completed repairs."
      />
      {warranties.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No warranties yet"
          hint="When a technician completes a repair and issues a warranty, it appears here permanently."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {warranties.map((w) => {
            const active = new Date(w.expires_at) > new Date();
            return (
              <div key={w.id} className={`card p-5 ${active ? 'border-emerald-200' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{w.title}</p>
                    <p className="text-xs text-slate-500">{w.category_name} · completed {formatDate(w.completed_at)}</p>
                  </div>
                  {active ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <ShieldCheck className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-500/20">
                      <ShieldAlert className="h-3.5 w-3.5" /> Expired
                    </span>
                  )}
                </div>
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-slate-700">
                    <span className="font-medium">{w.duration_days}-day warranty</span> · expires{' '}
                    <span className="font-medium">{formatDate(w.expires_at)}</span>
                  </p>
                  {w.terms && <p className="mt-1 text-xs text-slate-500">{w.terms}</p>}
                </div>
                {active && (
                  <p className="mt-3 text-xs text-slate-400">
                    Problem recurring? Contact your technician through your booking — this record is
                    your proof of warranty.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
