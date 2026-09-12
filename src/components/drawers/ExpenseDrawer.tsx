'use client';

import React, { useState } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { ExpensesApi, ExpenseCategory } from '@/lib/api/expenses';
import { toast } from 'sonner';
import { Receipt, Check, Zap, Building2 } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 24. Create Expense Drawer Form                                            */
/* -------------------------------------------------------------------------- */
export const CreateExpenseDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const [category, setCategory] = useState<ExpenseCategory>('DIRECT');
  const [expenseType, setExpenseType] = useState('ELECTRICITY_POWER');
  const [payeeName, setPayeeName] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [isGstApplicable, setIsGstApplicable] = useState(false);
  const [gstAmount, setGstAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payeeName.trim()) {
      toast.error('Payee / Vendor name is required');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await ExpensesApi.create({
        category,
        expense_type: expenseType,
        payee_name: payeeName.trim(),
        expense_date: expenseDate,
        amount: Number(amount),
        payment_mode: paymentMode,
        reference_no: referenceNo.trim() || undefined,
        is_gst_applicable: isGstApplicable,
        gst_amount: isGstApplicable && gstAmount ? Number(gstAmount) : 0,
        description: description.trim() || undefined,
      });

      toast.success('Expense voucher recorded successfully');
      instance.onSuccess?.();
      closeDrawer();
    } catch (err: any) {
      toast.error('Failed to save expense: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title="Record Expense Voucher"
      subtitle="Direct manufacturing costs or indirect administrative expenses"
      icon={<Receipt className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-2/3 py-2 bg-[var(--text-main)] hover:bg-[#2c2c2c] text-[var(--bg-surface)] font-semibold rounded-lg text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save Expense Voucher'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selector Buttons */}
        <div>
          <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1.5">
            Expense Category *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory('DIRECT');
                setExpenseType('ELECTRICITY_POWER');
              }}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                category === 'DIRECT'
                  ? 'bg-amber-100/60 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200'
                  : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Zap className="w-3.5 h-3.5" />
                <span>DIRECT (Production)</span>
              </div>
              <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                Power bill, machine repairs, fuel, tempo carting
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategory('INDIRECT');
                setExpenseType('RENT');
              }}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                category === 'INDIRECT'
                  ? 'bg-sky-100/60 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-200'
                  : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>INDIRECT (Admin)</span>
              </div>
              <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                Shed rent, staff salary, tea, GIDC tax, CA fees
              </p>
            </button>
          </div>
        </div>

        {/* Expense Sub-type */}
        <div>
          <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
            Expense Type *
          </label>
          <select
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value)}
            className="w-full px-2.5 py-2 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-medium focus:outline-hidden"
          >
            {category === 'DIRECT' ? (
              <>
                <option value="ELECTRICITY_POWER">Electricity / Power (Torrent/DGVCL)</option>
                <option value="MACHINE_REPAIR">Machine Repairs & Spare Mechanics</option>
                <option value="FUEL_DIESEL">Fuel / Generator Diesel</option>
                <option value="FREIGHT_CARTING">Tempo / Carting / Grey Transport</option>
                <option value="PACKING_LOADING">Packing & Loading Labor</option>
                <option value="MACHINE_OIL">Lubricant Oil & Consumables</option>
                <option value="OTHER_DIRECT">Other Direct Production Cost</option>
              </>
            ) : (
              <>
                <option value="STAFF_SALARY">Salary (Staff / Supervisor / Monthly Wages)</option>
                <option value="ADVANCE">Advance / Uchapat (Karigar / Worker Advance)</option>
                <option value="RENT">Factory Shed / Plot Rent</option>
                <option value="TEA_REFRESHMENT">Office Tea & Snacks for Traders</option>
                <option value="GIDC_TAX">GIDC Maintenance / Municipal Tax</option>
                <option value="SOFTWARE_INTERNET">Internet, Telephone & Software</option>
                <option value="CA_ACCOUNTING">Munimji / CA / Accounting Fees</option>
                <option value="BANK_CHARGES">Bank Charges & OD Interest</option>
                <option value="OTHER_INDIRECT">Other Indirect Overhead</option>
              </>
            )}
          </select>
        </div>

        {/* Payee Name & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Payee / Vendor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Torrent Power Ltd"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
            />
          </div>
        </div>

        {/* Amount & Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono font-bold focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs focus:outline-hidden"
            >
              <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
        </div>

        {/* Reference No */}
        <div>
          <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
            Bill No / UTR / Cheque Reference
          </label>
          <input
            type="text"
            placeholder="e.g. Bill #8812 / UTR 91823742"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
          />
        </div>

        {/* GST Input Option */}
        <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isGstApplicable}
              onChange={(e) => setIsGstApplicable(e.target.checked)}
              className="rounded text-[var(--primary)]"
            />
            <span>This expense bill has GST Input Tax Credit (ITC)</span>
          </label>

          {isGstApplicable && (
            <div className="pt-2 border-t border-[var(--border)]">
              <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
                GST Amount Claimable (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="GST amount included"
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
            Description / Remarks
          </label>
          <textarea
            rows={2}
            placeholder="Additional notes about this expense..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs focus:outline-hidden"
          />
        </div>
      </form>
    </Drawer>
  );
};
