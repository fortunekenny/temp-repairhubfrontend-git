import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LocateFixed, BadgeCheck, Clock, AlertTriangle } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import PhotoUploader from '../../components/PhotoUploader.jsx';
import { Spinner, PageHeader } from '../../components/ui.jsx';

export default function TechProfileForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(undefined); // undefined=loading, null=new
  const [form, setForm] = useState({
    bio: '',
    skills: '',
    address: '',
    service_radius_km: 20,
    base_fee: '',
    is_available: true,
    category_ids: [],
  });
  const [idDoc, setIdDoc] = useState([]);
  const [coords, setCoords] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
    api
      .get('/technicians/me')
      .then(({ data }) => {
        const p = data.profile;
        setProfile(p);
        setForm({
          bio: p.bio || '',
          skills: p.skills || '',
          address: p.address || '',
          service_radius_km: p.service_radius_km ?? 20,
          base_fee: p.base_fee != null ? String(Number(p.base_fee)) : '',
          is_available: p.is_available,
          category_ids: p.categories.map((c) => c.id),
        });
        if (p.id_document_url) setIdDoc([p.id_document_url]);
      })
      .catch(() => setProfile(null));
  }, []);

  function toggleCategory(id) {
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(id)
        ? f.category_ids.filter((c) => c !== id)
        : [...f.category_ids, id],
    }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        toast.success('Workshop location set from GPS');
        // Reverse-geocode so the human-readable address fills the field too.
        try {
          const { data } = await api.get('/geo/reverse', { params: { lat, lng } });
          if (data.location?.display_name) {
            setForm((f) => ({ ...f, address: data.location.display_name }));
          }
        } catch {
          /* coords are still attached — address text is a nicety, not required */
        }
      },
      () => toast.error('Could not get location — your address will be geocoded instead')
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.category_ids.length === 0) return toast.error('Pick at least one service category');
    setBusy(true);
    try {
      await api.put('/technicians/me', {
        bio: form.bio.trim() || undefined,
        skills: form.skills.trim() || undefined,
        address: form.address.trim() || undefined,
        service_radius_km: Number(form.service_radius_km) || undefined,
        base_fee: form.base_fee === '' ? undefined : Number(form.base_fee),
        is_available: form.is_available,
        category_ids: form.category_ids,
        id_document_url: idDoc[0],
        ...(coords || {}),
      });
      toast.success(profile ? 'Profile updated' : 'Profile created — awaiting admin verification');
      navigate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save profile'));
    } finally {
      setBusy(false);
    }
  }

  if (profile === undefined) return <Spinner />;

  const statusBanner = {
    pending: {
      cls: 'border-amber-200 bg-amber-50 text-amber-800',
      icon: Clock,
      text: 'Your profile is awaiting admin verification. You can keep editing meanwhile.',
    },
    approved: {
      cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      icon: BadgeCheck,
      text: 'You are verified! Customers can find you and you can quote on requests.',
    },
    rejected: {
      cls: 'border-red-200 bg-red-50 text-red-800',
      icon: AlertTriangle,
      text: 'Your verification was rejected. Update your details and ID document, then contact support.',
    },
  }[profile?.verification_status];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={profile ? 'Service profile' : 'Set up your service profile'}
        subtitle="This is what customers see when comparing technicians."
      />

      {statusBanner && (
        <div className={`mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm ${statusBanner.cls}`}>
          <statusBanner.icon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{statusBanner.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5 p-5 sm:p-8">
        <div>
          <span className="label">Service categories</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  form.category_ids.includes(c.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="bio">About you</label>
          <textarea
            id="bio"
            rows={3}
            className="input"
            placeholder="e.g. Phone repair specialist with 5 years of experience. Same-day fixes for most screen and battery issues."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="skills">Skills</label>
          <input
            id="skills"
            className="input"
            placeholder="e.g. screen replacement, battery, water damage recovery"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">Comma-separated — customers can search these.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="address">Workshop / base address</label>
            <div className="flex gap-2">
              <input
                id="address"
                className="input"
                placeholder="e.g. Ikeja, Lagos"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <button
                type="button"
                onClick={useMyLocation}
                title="Use GPS"
                className={`btn-secondary shrink-0 !px-3 ${coords ? '!border-emerald-300 !bg-emerald-50 !text-emerald-700' : ''}`}
              >
                <LocateFixed className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="radius">Service radius (km)</label>
            <input
              id="radius"
              type="number"
              min={1}
              max={200}
              className="input"
              value={form.service_radius_km}
              onChange={(e) => setForm({ ...form, service_radius_km: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="fee">Base call-out fee (₦) <span className="font-normal text-slate-400">(optional)</span></label>
          <input
            id="fee"
            type="number"
            min={0}
            className="input"
            placeholder="e.g. 2000"
            value={form.base_fee}
            onChange={(e) => setForm({ ...form, base_fee: e.target.value })}
          />
        </div>

        <PhotoUploader
          photos={idDoc}
          onChange={setIdDoc}
          max={1}
          label="ID document (NIN slip, driver's licence, or voter's card) — required for verification"
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={form.is_available}
            onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
          />
          I'm currently available for new jobs
        </label>

        <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
          {busy ? 'Saving…' : profile ? 'Save changes' : 'Create profile & request verification'}
        </button>
      </form>
    </div>
  );
}
