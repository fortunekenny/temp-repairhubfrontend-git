import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, LocateFixed } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import PhotoUploader from '../../components/PhotoUploader.jsx';
import { PageHeader } from '../../components/ui.jsx';

export default function NewRequest() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', title: '', description: '', address: '' });
  const [photos, setPhotos] = useState([]);
  const [coords, setCoords] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        toast.success('Precise location attached');
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
      () => toast.error('Could not get location — enter your address instead')
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category_id) return toast.error('Select a service category');
    setBusy(true);
    try {
      const { data } = await api.post('/requests', {
        category_id: Number(form.category_id),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        photos,
        ...(coords || {}),
      });
      toast.success('Request posted — nearby technicians have been notified!');
      navigate(`/requests/${data.request.id}`);
    } catch (err) {
      toast.error(errMsg(err, 'Could not create request'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/requests" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> My requests
      </Link>
      <PageHeader
        title="New repair request"
        subtitle="Describe the problem — verified technicians near you will send quotations."
      />

      <form onSubmit={handleSubmit} className="card space-y-5 p-5 sm:p-8">
        <div>
          <label className="label" htmlFor="category">What needs repair?</label>
          <select
            id="category"
            required
            className="input"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="title">Title</label>
          <input
            id="title"
            required
            maxLength={120}
            className="input"
            placeholder='e.g. "Cracked iPhone 12 screen"'
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="description">Describe the problem</label>
          <textarea
            id="description"
            rows={4}
            className="input"
            placeholder="What happened? Does it still power on? Any error messages? The more detail, the more accurate the quotes."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <PhotoUploader photos={photos} onChange={setPhotos} />

        <div>
          <label className="label" htmlFor="address">Your location</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="address"
              className="input"
              placeholder="e.g. Yaba, Lagos"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <button
              type="button"
              onClick={useMyLocation}
              className={`btn-secondary shrink-0 ${coords ? '!border-emerald-300 !bg-emerald-50 !text-emerald-700' : ''}`}
            >
              <LocateFixed className="h-4 w-4" /> {coords ? 'Location attached' : 'Use GPS'}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Used to match you with technicians who serve your area. Leave blank to use your
            approximate location automatically.
          </p>
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
          {busy ? 'Posting request…' : 'Post repair request'}
        </button>
      </form>
    </div>
  );
}
