import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, MapPin, Clock, ArrowLeft, MessageSquare } from 'lucide-react';
import api from '../api/client.js';
import { naira, formatDate } from '../lib/format.js';
import { Spinner, EmptyState, RatingStars } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function TechnicianDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/technicians/${id}`)
      .then(({ data }) => setTech(data.technician))
      .catch(() => setError('Technician not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner label="Loading profile…" />;
  if (error) return <EmptyState title={error} action={<Link to="/technicians" className="btn-secondary mt-2">Back to search</Link>} />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/technicians" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              {tech.name}
              <BadgeCheck className="h-6 w-6 text-blue-600" title="Verified technician" />
            </h1>
            <div className="mt-1">
              <RatingStars value={tech.rating_avg} count={tech.rating_count} size="h-5 w-5" />
            </div>
          </div>
          {tech.base_fee != null && Number(tech.base_fee) > 0 && (
            <div className="rounded-lg bg-slate-50 px-4 py-2 text-right">
              <p className="text-xs text-slate-500">Base call-out fee</p>
              <p className="text-lg font-bold text-slate-900">{naira(tech.base_fee)}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400" /> {tech.address || 'Nigeria'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" /> Serves within {tech.service_radius_km} km
          </span>
        </div>

        {tech.bio && <p className="mt-4 text-slate-700">{tech.bio}</p>}
        {tech.skills && (
          <p className="mt-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">Skills:</span> {tech.skills}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {tech.categories?.map((c) => (
            <span key={c.id} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {c.name}
            </span>
          ))}
        </div>

        {(!user || user.role === 'customer') && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
            Post a repair request in one of this technician's categories and they'll be notified to
            send you a quotation.
            <div className="mt-3">
              <Link to={user ? '/requests/new' : '/register'} className="btn-primary">
                Request a repair
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <MessageSquare className="h-5 w-5 text-slate-400" /> Reviews ({tech.reviews?.length || 0})
      </h2>
      {!tech.reviews?.length ? (
        <EmptyState title="No reviews yet" hint="Reviews appear here after customers complete repairs with this technician." />
      ) : (
        <div className="space-y-3">
          {tech.reviews.map((r, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{r.customer_name}</p>
                <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
              </div>
              <RatingStars value={r.rating} />
              {r.comment && <p className="mt-1.5 text-sm text-slate-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
