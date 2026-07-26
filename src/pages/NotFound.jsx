import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Home, SearchX } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center sm:py-20">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <SearchX className="h-8 w-8 text-slate-400" />
      </span>

      <div>
        <p className="text-sm font-semibold text-blue-600">404</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          We couldn’t find that page
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          The link may be out of date, or the address may have a typo.
        </p>
      </div>

      {/* Showing the path they asked for is usually enough for someone to spot their own typo. */}
      <code className="max-w-full truncate rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
        {pathname}
      </code>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
        <Link to={user ? '/dashboard' : '/'} className="btn-primary">
          <Home className="h-4 w-4" /> {user ? 'Dashboard' : 'Home'}
        </Link>
      </div>

      <Link
        to="/technicians"
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <Compass className="h-4 w-4" /> Browse technicians
      </Link>
    </div>
  );
}
