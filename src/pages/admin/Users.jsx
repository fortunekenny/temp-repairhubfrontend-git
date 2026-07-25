import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../api/client.js';
import { formatDate } from '../../lib/format.js';
import { Spinner, EmptyState, PageHeader } from '../../components/ui.jsx';

const ROLE_STYLES = {
  customer: 'bg-blue-50 text-blue-700',
  technician: 'bg-violet-50 text-violet-700',
  admin: 'bg-slate-800 text-white',
};

export default function Users() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    api.get('/admin/users').then(({ data }) => setUsers(data.users)).catch(() => setUsers([]));
  }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const needle = q.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!role || u.role === role) &&
        (!needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle))
    );
  }, [users, q, role]);

  if (!users) return <Spinner />;

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} registered users on the platform.`} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input !pl-9"
            placeholder="Search by name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input sm:w-44" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="technician">Technicians</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No users match" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
