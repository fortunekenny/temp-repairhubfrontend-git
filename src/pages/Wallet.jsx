import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet as WalletIcon, Banknote, ArrowDownCircle, ArrowUpCircle, Landmark, BadgeCheck } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { naira, formatDateTime } from '../lib/format.js';
import { Spinner, EmptyState, Modal, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Wallet() {
  const { user } = useAuth();
  const isTech = user.role === 'technician';
  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null);
  const [banks, setBanks] = useState([]);
  const [bankModal, setBankModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [bankForm, setBankForm] = useState({ bank_code: '', account_number: '' });
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/wallet').then(({ data }) => setWallet(data)).catch(() => setWallet({ balance: 0, transactions: [] }));
    if (isTech) {
      api.get('/technicians/me').then(({ data }) => setProfile(data.profile)).catch(() => {});
    }
  }, [isTech]);

  useEffect(() => {
    load();
  }, [load]);

  async function openBankModal() {
    setBankModal(true);
    if (banks.length === 0) {
      try {
        const { data } = await api.get('/payments/banks');
        setBanks(data.banks);
      } catch (err) {
        toast.error(errMsg(err, 'Could not load banks'));
      }
    }
  }

  async function verifyBank() {
    if (!bankForm.bank_code || !bankForm.account_number) return toast.error('Select a bank and enter your account number');
    setBusy(true);
    try {
      const { data } = await api.post('/technicians/me/bank', bankForm);
      toast.success(`Account verified: ${data.bank_account.account_name}`);
      setBankModal(false);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Bank verification failed'));
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    const n = Number(amount);
    if (!n || n <= 0) return toast.error('Enter a valid amount');
    setBusy(true);
    try {
      const { data } = await api.post('/wallet/withdraw', { amount: n });
      toast.success(`Withdrawal processed — new balance ${naira(data.balance)}`);
      setWithdrawModal(false);
      setAmount('');
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Withdrawal failed'));
    } finally {
      setBusy(false);
    }
  }

  if (!wallet) return <Spinner />;

  const hasBank = Boolean(profile?.account_number);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Wallet" subtitle={isTech ? 'Your repair earnings and payouts.' : 'Your wallet activity.'} />

      <div className="card bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
        <p className="flex items-center gap-2 text-sm text-blue-100">
          <WalletIcon className="h-4 w-4" /> Available balance
        </p>
        <p className="mt-1 text-4xl font-extrabold">{naira(wallet.balance)}</p>
        {isTech && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => (hasBank ? setWithdrawModal(true) : openBankModal())}
              className="btn bg-white text-blue-700 hover:bg-blue-50 focus:ring-white"
            >
              <Banknote className="h-4 w-4" /> Withdraw to bank
            </button>
            {hasBank ? (
              <span className="flex items-center gap-1.5 text-sm text-blue-100">
                <BadgeCheck className="h-4 w-4" /> {profile.account_name} · ****{profile.account_number.slice(-4)}
                <button onClick={openBankModal} className="underline decoration-blue-300 underline-offset-2 hover:text-white">
                  change
                </button>
              </span>
            ) : (
              <button onClick={openBankModal} className="flex items-center gap-1.5 text-sm text-blue-100 underline decoration-blue-300 underline-offset-2 hover:text-white">
                <Landmark className="h-4 w-4" /> Verify your bank account first
              </button>
            )}
          </div>
        )}
      </div>

      <h2 className="mb-3 mt-8 font-semibold text-slate-900">Transactions</h2>
      {wallet.transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          hint={isTech ? 'Earnings land here automatically when customers pay for completed repairs.' : 'Wallet activity will appear here.'}
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {wallet.transactions.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              {t.type === 'credit' ? (
                <ArrowDownCircle className="h-6 w-6 shrink-0 text-emerald-500" />
              ) : (
                <ArrowUpCircle className="h-6 w-6 shrink-0 text-red-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{t.description}</p>
                <p className="text-xs text-slate-400">{formatDateTime(t.created_at)}</p>
              </div>
              <span className={`shrink-0 font-semibold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                {t.type === 'credit' ? '+' : '−'}{naira(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bank verification modal */}
      <Modal open={bankModal} onClose={() => !busy && setBankModal(false)} title="Verify bank account">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Your account name is resolved directly from the bank — payouts can only go to a verified
            account in your name.
          </p>
          <div>
            <label className="label" htmlFor="bank">Bank</label>
            <select
              id="bank"
              className="input"
              value={bankForm.bank_code}
              onChange={(e) => setBankForm({ ...bankForm, bank_code: e.target.value })}
            >
              <option value="">{banks.length ? 'Select your bank…' : 'Loading banks…'}</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="acct">Account number</label>
            <input
              id="acct"
              inputMode="numeric"
              maxLength={10}
              className="input"
              placeholder="0123456789"
              value={bankForm.account_number}
              onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setBankModal(false)} disabled={busy} className="btn-secondary">Cancel</button>
            <button onClick={verifyBank} disabled={busy} className="btn-primary">
              {busy ? 'Verifying…' : 'Verify account'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Withdraw modal */}
      <Modal open={withdrawModal} onClose={() => !busy && setWithdrawModal(false)} title="Withdraw earnings">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Available: <span className="font-semibold">{naira(wallet.balance)}</span> → {profile?.account_name} ({profile?.bank_code} ****{profile?.account_number?.slice(-4)})
          </p>
          <div>
            <label className="label" htmlFor="wamount">Amount (₦)</label>
            <input
              id="wamount"
              type="number"
              min={1}
              max={wallet.balance}
              className="input"
              placeholder="e.g. 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setWithdrawModal(false)} disabled={busy} className="btn-secondary">Cancel</button>
            <button onClick={withdraw} disabled={busy} className="btn-success">
              {busy ? 'Processing…' : 'Withdraw'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
