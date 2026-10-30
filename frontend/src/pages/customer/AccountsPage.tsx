import React, { useEffect, useState } from 'react';
import { accountApi } from '../../api/accountApi';
import { Account } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CreditCard, Plus, ShieldCheck, ArrowRight, Lock, Unlock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [newAccType, setNewAccType] = useState<string>('SAVINGS');
  const [newAccDeposit, setNewAccDeposit] = useState<string>('500');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountApi.getMyAccounts();
      setAccounts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await accountApi.createAccount({
        accountType: newAccType,
        currency: 'INR',
        initialDeposit: parseFloat(newAccDeposit) || 0,
      });
      setModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not open account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFreeze = async (acc: Account) => {
    try {
      if (acc.status === 'ACTIVE') {
        await accountApi.freezeAccount(acc.id, 'User self-freeze security hold');
      } else {
        await accountApi.unfreezeAccount(acc.id, 'User self-reactivation');
      }
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Virtual Bank Accounts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your simulated checking, savings, and commercial liquidity pools.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-900 text-white">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{acc.accountType} Account</h3>
                    <p className="text-xs font-mono text-slate-400">{acc.accountNumber}</p>
                  </div>
                </div>
                <Badge status={acc.status} />
              </div>

              <div className="mt-6">
                <p className="text-xs text-slate-400 font-medium">Available Balance</p>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-0.5">
                  ₹{Number(acc.availableBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
                <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-500">
                  <span>Ledger Balance: ₹{Number(acc.ledgerBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <span>•</span>
                  <span>{acc.currency || 'INR'}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
              <button
                onClick={() => handleToggleFreeze(acc)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  acc.status === 'ACTIVE'
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {acc.status === 'ACTIVE' ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Freeze</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unfreeze</span>
                  </>
                )}
              </button>

              <Link
                to={`/send-money?source=${acc.accountNumber}`}
                className="flex items-center space-x-1 text-brand-600 hover:text-brand-700"
              >
                <span>Transfer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for opening a new account */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Open New Virtual Bank Account">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Account Type</label>
            <select
              value={newAccType}
              onChange={(e) => setNewAccType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="CHECKING">Checking Account (Daily transactions & P2P)</option>
              <option value="SAVINGS">Savings Account (Interest earning & reserves)</option>
              <option value="BUSINESS">Business Account (Commercial liquidity)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Initial Simulated Deposit (₹ INR)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={newAccDeposit}
              onChange={(e) => setNewAccDeposit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Generating Account...' : 'Open Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
