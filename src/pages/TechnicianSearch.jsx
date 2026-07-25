import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Search, LocateFixed, BadgeCheck, UserSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import { naira } from '../lib/format.js';
import { Spinner, EmptyState, RatingStars, PageHeader } from '../components/ui.jsx';

export default function TechnicianSearch() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [techs, setTechs] = useState([]);
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get('q') || '');
  const [coords, setCoords] = useState(null);

  const category = params.get('category') || '';

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/technicians', {
        params: {
          category: category || undefined,
          q: q.trim() || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        },
      });
      setTechs(data.technicians);
      setCenter(data.search_center);
    } catch {
      setTechs([]);
    } finally {
      setLoading(false);
    }
  }, [category, q, coords]);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, coords]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Using your precise location');
      },
      () => toast.error('Could not get your location — using approximate IP location instead')
    );
  }

  return (
    <div>
      <PageHeader
        title="Find a technician"
        subtitle={
          center
            ? `Showing verified technicians near ${center.city || 'you'} (${center.source === 'client' ? 'GPS' : 'approximate IP'} location)`
            : 'Browse verified repair technicians'
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input !pl-9"
            placeholder="Search by name or skill (e.g. screen replacement)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
        </div>
        <select
          className="input sm:w-56"
          value={category}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            e.target.value ? next.set('category', e.target.value) : next.delete('category');
            setParams(next);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button onClick={useMyLocation} className="btn-secondary" title="Use my precise location">
          <LocateFixed className="h-4 w-4" /> Near me
        </button>
        <button onClick={search} className="btn-primary">
          Search
        </button>
      </div>

      {loading ? (
        <Spinner label="Finding technicians…" />
      ) : techs.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title="No technicians found"
          hint="Try a different category, widen your search, or check back soon — new technicians are verified daily."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techs.map((t) => (
            <Link key={t.id} to={`/technicians/${t.id}`} className="card p-5 transition hover:border-blue-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                    {t.name}
                    <BadgeCheck className="h-4 w-4 text-blue-600" title="Verified" />
                  </p>
                  <RatingStars value={t.rating_avg} count={t.rating_count} />
                </div>
                {t.distance_km != null && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {Number(t.distance_km).toFixed(1)} km
                  </span>
                )}
              </div>
              {t.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{t.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.categories.slice(0, 3).map((c) => (
                  <span key={c.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {c.name}
                  </span>
                ))}
                {t.categories.length > 3 && (
                  <span className="text-xs text-slate-400">+{t.categories.length - 3} more</span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> {t.address || 'Nigeria'}
                </span>
                {t.base_fee != null && Number(t.base_fee) > 0 && (
                  <span className="font-medium text-slate-700">from {naira(t.base_fee)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
