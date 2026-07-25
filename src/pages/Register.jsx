import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Wrench } from 'lucide-react';
import { errMsg } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: params.get('role') === 'technician' ? 'technician' : 'customer',
  });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setBusy(true);
    try {
      const user = await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success(`Welcome to RepairHub, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'technician' ? '/tech/profile' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Registration failed'));
    } finally {
      setBusy(false);
    }
  }

  const roleBtn = (role, Icon, title, text) => (
    <button
      type="button"
      onClick={() => setForm({ ...form, role })}
      className={`flex flex-1 flex-col items-start gap-1 rounded-lg border p-4 text-left transition ${
        form.role === role
          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20'
          : 'border-slate-300 bg-white hover:border-slate-400'
      }`}
    >
      <Icon className={`h-5 w-5 ${form.role === role ? 'text-blue-600' : 'text-slate-400'}`} />
      <span className="text-sm font-semibold text-slate-900">{title}</span>
      <span className="text-xs text-slate-500">{text}</span>
    </button>
  );

  return (
    <div className="mx-auto max-w-md pt-8">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Join Nigeria's trusted repair marketplace.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="flex gap-3">
            {roleBtn('customer', User, 'I need repairs', 'Request quotes from verified technicians')}
            {roleBtn('technician', Wrench, "I'm a technician", 'Get verified and earn from repair jobs')}
          </div>
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input
              id="name"
              required
              className="input"
              placeholder="Ada Obi"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone <span className="font-normal text-slate-400">(optional)</span></label>
            <input
              id="phone"
              type="tel"
              className="input"
              placeholder="+234 801 234 5678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className="input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Creating account…' : form.role === 'technician' ? 'Sign up as technician' : 'Sign up'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
