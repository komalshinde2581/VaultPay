import React, { useEffect, useState } from 'react';
import { beneficiaryApi } from '../../api/beneficiaryApi';
import { Beneficiary } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Users, UserPlus, Trash2, Clock, ShieldCheck, AlertCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BeneficiariesPage: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [targetAccount, setTargetAccount] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [limit, setLimit] = useState<string>('1000');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const data = await beneficiaryApi.getMyBeneficiaries();
      setBeneficiaries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await beneficiaryApi.addBeneficiary({
        targetAccountNumber: targetAccount,
        beneficiaryName: name,
        nickname: nickname || undefined,
        transferLimit: parseFloat(limit) || 1000,
      });
      setModalOpen(false);
      setTargetAccount('');
      setName('');
      setNickname('');
      fetchBeneficiaries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add beneficiary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this beneficiary?')) return;
    try {
      await beneficiaryApi.deleteBeneficiary(id);
      fetchBeneficiaries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove beneficiary');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manage Beneficiaries</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered recipients for rapid payments with anti-fraud cooling periods.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Beneficiary</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {beneficiaries.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200/80">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Beneficiaries Added</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add frequent contacts to quickly transfer funds without having to memorize account numbers.
            </p>
          </div>
        ) : (
          beneficiaries.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-sm">
                      {b.beneficiaryName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">{b.beneficiaryName}</h3>
                      {b.nickname && <p className="text-xs text-slate-400">{b.nickname}</p>}
                    </div>
                  </div>
                  <Badge status={b.status} />
                </div>

                <div className="mt-5 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Account Number</span>
                    <span className="font-mono font-medium text-slate-800">{b.targetAccountNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Bank</span>
                    <span className="font-medium text-slate-800">{b.bankName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Limit</span>
                    <span className="font-semibold text-slate-800">₹{Number(b.transferLimit).toLocaleString('en-IN')} INR</span>
                  </div>
                </div>

                {b.coolingActive && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start space-x-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Cooling Period Active</span>
                      <span>Restricted to max ₹{Number(b.transferLimit).toLocaleString('en-IN')} until {new Date(b.coolingEndsAt!).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-rose-500 hover:text-rose-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>

                <Link
                  to={`/send-money`}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Money</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Beneficiary Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Beneficiary">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Account Number</label>
            <input
              type="text"
              required
              placeholder="e.g. VP-2000201"
              value={targetAccount}
              onChange={(e) => setTargetAccount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Beneficiary Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nickname (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Sarah Roommate"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Initial Transfer Limit (₹ INR)</label>
            <input
              type="number"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-brand-600 shrink-0" />
            <span>A 24-hour security cooling period will automatically safeguard transfers to this beneficiary.</span>
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
              {submitting ? 'Registering...' : 'Add Beneficiary'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
