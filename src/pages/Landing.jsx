import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale, MapPin, BadgeCheck, ArrowRight, Smartphone, Refrigerator, Armchair, Wrench, Car, Laptop } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORY_ICONS = {
  smartphones: Smartphone,
  laptops: Laptop,
  refrigerators: Refrigerator,
  upholstery: Armchair,
  'vehicle-diagnostics': Car,
};

const STEPS = [
  { n: 1, title: 'Describe the problem', text: 'Pick a category, add photos and your location. Nearby verified technicians are notified instantly.' },
  { n: 2, title: 'Compare quotations', text: 'Technicians send transparent quotes with price, timeline and their verified rating. You choose.' },
  { n: 3, title: 'Track the repair', text: 'Follow live status updates from booking to completion, with notifications at every step.' },
  { n: 4, title: 'Pay securely & review', text: 'Pay through the platform only after the repair is complete — then rate your technician.' },
];

const TRUST = [
  { icon: BadgeCheck, title: 'Verified technicians', text: 'Every technician passes ID and bank-account verification before they can take jobs.' },
  { icon: Scale, title: 'Transparent pricing', text: 'Compare multiple quotations side by side before any work begins. No surprises.' },
  { icon: MapPin, title: 'Local matching', text: 'Requests reach technicians who actually serve your area, sorted by distance.' },
  { icon: ShieldCheck, title: 'Warranty on repairs', text: 'Completed repairs come with digital warranty records you can always access.' },
];

export default function Landing() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  return (
    <div className="space-y-14 sm:space-y-20">
      {/* Hero */}
      <section className="grid items-center gap-8 pt-2 sm:gap-10 sm:pt-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Nigeria's trusted repair marketplace
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Repair it, don't <span className="text-blue-600">replace it.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            RepairHub connects you with verified repair technicians for phones, laptops, appliances,
            furniture and more. Compare quotes, book with confidence, track every step, and pay
            securely — only when the job is done.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {user ? (
              <Link to="/dashboard" className="btn-primary !px-6 !py-3 text-base">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary !px-6 !py-3 text-base">
                  Request a repair <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/register?role=technician" className="btn-secondary !px-6 !py-3 text-base">
                  Join as a technician
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5">
              <Icon className="mb-3 h-7 w-7 text-blue-600" />
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <h2 className="mb-2 text-center text-xl font-bold text-slate-900 sm:text-2xl">What needs fixing?</h2>
          <p className="mb-6 text-center text-sm text-slate-500 sm:mb-8 sm:text-base">From cracked screens to leaky pipes — we cover it.</p>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => {
              const Icon = CATEGORY_ICONS[c.slug] || Wrench;
              return (
                <Link
                  key={c.id}
                  to={`/technicians?category=${c.slug}`}
                  className="card flex items-center gap-3 p-4 transition hover:border-blue-300 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 text-sm font-medium text-slate-800">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="rounded-2xl bg-slate-900 px-5 py-10 text-white sm:px-10 sm:py-12">
        <h2 className="mb-8 text-center text-xl font-bold sm:mb-10 sm:text-2xl">How RepairHub works</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                {s.n}
              </span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technician CTA */}
      <section className="card flex flex-col items-center gap-4 p-6 text-center sm:p-10">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Are you a skilled technician?</h2>
        <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
          Stop relying on word-of-mouth. Get verified, receive repair requests from customers near
          you, quote your own prices, and get paid straight to your wallet with instant payouts to
          your bank account.
        </p>
        <Link to="/register?role=technician" className="btn-primary !px-6 !py-3">
          Start earning on RepairHub
        </Link>
      </section>
    </div>
  );
}
