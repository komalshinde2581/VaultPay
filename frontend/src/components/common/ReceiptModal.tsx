import React from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { TransactionReceipt } from '../../types';
import { CheckCircle2, Copy, Download, Share2 } from 'lucide-react';

interface ReceiptModalProps {
  receipt: TransactionReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
  if (!receipt) return null;

  const copyRef = () => {
    navigator.clipboard.writeText(receipt.reference);
    alert('Reference code copied to clipboard!');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Receipt" maxWidth="max-w-md">
      <div className="text-center pb-4 border-b border-slate-100">
        <div className="inline-flex p-3 bg-emerald-50 rounded-full text-emerald-600 mb-3">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Payment Completed</p>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">
          ₹{Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </h2>
        <p className="text-xs text-slate-500 mt-1">{receipt.currency || 'INR'} • Zero Processing Fee</p>
      </div>

      <div className="py-4 space-y-3 text-sm">
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500">Status</span>
          <Badge status={receipt.status} />
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500">Reference</span>
          <div className="flex items-center space-x-1.5 font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
            <span>{receipt.reference}</span>
            <button onClick={copyRef} title="Copy reference" className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500">Sender</span>
          <div className="text-right">
            <p className="font-medium text-slate-800">{receipt.senderName}</p>
            <p className="text-xs font-mono text-slate-400">{receipt.senderAccountNumber}</p>
          </div>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500">Recipient</span>
          <div className="text-right">
            <p className="font-medium text-slate-800">{receipt.receiverName}</p>
            <p className="text-xs font-mono text-slate-400">{receipt.receiverAccountNumber}</p>
          </div>
        </div>

        {receipt.description && (
          <div className="flex justify-between items-start py-1">
            <span className="text-slate-500">Description</span>
            <span className="text-slate-800 text-right font-medium max-w-[200px] truncate">{receipt.description}</span>
          </div>
        )}

        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500">Timestamp</span>
          <span className="text-slate-600 text-xs">
            {new Date(receipt.completedAt || receipt.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center space-x-3">
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Print / PDF</span>
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium text-sm transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};
