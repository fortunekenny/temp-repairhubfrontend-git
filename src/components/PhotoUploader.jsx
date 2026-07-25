import { useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ImagePlus, Link2, Loader2, X } from 'lucide-react';
import api, { errMsg } from '../api/client.js';

/**
 * Uploads photos direct-to-Cloudinary using the backend's signed params.
 * When the backend has no Cloudinary keys (mock_mode) it falls back to
 * letting the user paste image URLs, so the flow still works end-to-end.
 *
 * Props: photos (string[]), onChange(string[]), max (default 5), label
 */
export default function PhotoUploader({ photos, onChange, max = 5, label = 'Photos of the item' }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);

  async function handleFiles(files) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { data: sig } = await api.post('/uploads/signature');
      if (sig.mock_mode) {
        setShowUrlField(true);
        toast('Image hosting is not configured on the server — paste an image URL instead.', { icon: 'ℹ️' });
        return;
      }
      const remaining = max - photos.length;
      for (const file of Array.from(files).slice(0, remaining)) {
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', sig.api_key);
        form.append('timestamp', sig.timestamp);
        form.append('folder', sig.folder);
        form.append('signature', sig.signature);
        const { data } = await axios.post(sig.upload_url, form);
        onChange([...photos, data.secure_url]);
        photos = [...photos, data.secure_url];
      }
    } catch (err) {
      toast.error(errMsg(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error('Enter a valid URL (https://…)');
      return;
    }
    onChange([...photos, url]);
    setUrlInput('');
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-3">
        {photos.map((url, i) => (
          <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" onError={(e) => (e.target.style.opacity = 0.3)} />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute right-0.5 top-0.5 rounded-full bg-slate-900/70 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-blue-400 hover:text-blue-500"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[10px]">{uploading ? 'Uploading' : 'Add photo'}</span>
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="mt-2">
        {showUrlField || photos.length >= max ? null : (
          <button
            type="button"
            onClick={() => setShowUrlField(true)}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
          >
            <Link2 className="h-3.5 w-3.5" /> or paste an image URL
          </button>
        )}
        {showUrlField && photos.length < max && (
          <div className="mt-1 flex gap-2">
            <input
              className="input"
              placeholder="https://example.com/photo.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
            />
            <button type="button" onClick={addUrl} className="btn-secondary shrink-0">
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
