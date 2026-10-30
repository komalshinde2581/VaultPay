import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { accountApi } from '../../api/accountApi';
import { beneficiaryApi } from '../../api/beneficiaryApi';
import { transferApi } from '../../api/transferApi';
import { Account, Beneficiary, TransactionReceipt, TransferResponse } from '../../types';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { Send, ShieldCheck, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

export const SendMoneyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedSource = searchParams.get('source') || '';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sourceAccount, setSourceAccount] = useState<string>(preselectedSource);
  const [destinationAccount, setDestinationAccount] = useState<string>('');
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [accs, bens] = await Promise.all([
          accountApi.getMyAccounts(),
          beneficiaryApi.getMyBeneficiaries(),
        ]);
        setAccounts(accs);
        setBeneficiaries(bens);
        if (accs.length > 0 && !sourceAccount) {
          setSourceAccount(accs[0].accountNumber);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleBeneficiarySelect = (id: string) => {
    setSelectedBeneficiaryId(id);
    if (!id) return;
    const found = beneficiaries.find((b) => b.id === parseInt(id));
    if (found) {
      setDestinationAccount(found.targetAccountNumber);
    }
  };

  const selectedAcc = accounts.find((a) => a.accountNumber === sourceAccount);
  const numAmount = parseFloat(amount) || 0;
  const isOverBalance = selectedAcc ? numAmount > selectedAcc.availableBalance : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res: TransferResponse = await transferApi.executeTransfer({
        sourceAccountNumber: sourceAccount,
        destinationAccountNumber: destinationAccount,
        amount: numAmount,
        description: description || 'P2P Virtual Transfer',
      });

      // Fetch official receipt
      const fullReceipt = await transferApi.getByReference(res.transactionReference);
      setReceipt(fullReceipt);

      // Reset form
      setAmount('');
      setDescription('');
      // Reload accounts for refreshed balances
      const updatedAccounts = await accountApi.getMyAccounts();
      setAccounts(updatedAccounts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transfer failed. Please check parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Transfer Virtual Funds</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Execute instant transfers secured by strict double-entry ledger bookkeeping.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Transfer Rejected</p>
              <p className="text-xs mt-0.5 text-rose-600">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
          {/* 1. Source Account */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-xs">
              1. Deduct From Account
            </label>
            <select
              value={sourceAccount}
              onChange={(e) => setSourceAccount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.accountNumber}>
                  {a.accountType} ({a.accountNumber}) — Available: ₹{Number(a.availableBalance).toLocaleString('en-IN')} {a.currency || 'INR'}
                </option>
              ))}
            </select>
            {selectedAcc && (
              <p className="mt-1.5 text-xs text-slate-400">
                Current Available Limit: ₹{Number(selectedAcc.availableBalance).toLocaleString('en-IN')} INR
              </p>
            )}
          </div>

          {/* 2. Destination Beneficiary or Account */}
          <div className="space-y-3">
            <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-xs">
              2. Recipient Destination
            </label>

            {beneficiaries.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 block mb-1">Select from Registered Beneficiaries</label>
                <select
                  value={selectedBeneficiaryId}
                  onChange={(e) => handleBeneficiarySelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Choose Beneficiary or Enter Manually --</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.beneficiaryName} ({b.targetAccountNumber}) {b.coolingActive ? '⏳ (Cooling Period Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-500 block mb-1">Or Enter Account Number Directly</label>
              <input
                type="text"
                required
                placeholder="e.g. VP-2000201"
                value={destinationAccount}
                onChange={(e) => {
                  setDestinationAccount(e.target.value);
                  setSelectedBeneficiaryId('');
                }}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* 3. Amount */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-xs">
              3. Transfer Amount (₹ INR)
            </label>
            <div className="relative rounded-2xl shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-lg">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-9 pr-4 py-3 rounded-2xl border text-slate-900 font-extrabold text-lg focus:outline-none focus:ring-2 ${
                  isOverBalance
                    ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500'
                    : 'border-slate-200 bg-slate-50 focus:ring-brand-500'
                }`}
              />
            </div>

            {isOverBalance && (
              <p className="mt-1.5 text-xs font-semibold text-rose-600">
                Warning: Requested amount exceeds current available account balance.
              </p>
            )}
          </div>

          {/* 4. Description */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-xs">
              4. Payment Memo / Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Apartment rent, Consulting invoice #402"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Security Guarantee Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Idempotency-Key enabled: Retries will not double-charge.</span>
            </div>
            <span className="font-mono text-slate-400">Pessimistic Locked</span>
          </div>

          <button
            type="submit"
            disabled={submitting || isOverBalance || !numAmount}
            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/25 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Executing Double-Entry Transfer...' : `Confirm & Send ₹${numAmount.toLocaleString('en-IN')} INR`}</span>
          </button>
        </form>
      </div>

      <ReceiptModal
        isOpen={!!receipt}
        receipt={receipt}
        onClose={() => setReceipt(null)}
      />
    </div>
  );
};
