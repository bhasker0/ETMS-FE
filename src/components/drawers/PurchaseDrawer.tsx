'use client';

import React, { useState } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { PurchasesApi, PurchaseItem, PurchaseApiItem } from '@/lib/api/purchases';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';
import { ShoppingBag, Check, Plus, X } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 22. Create Purchase Invoice Drawer Form                                   */
/* -------------------------------------------------------------------------- */
export const CreatePurchaseDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const [supplierName, setSupplierName] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('YARN_DHAGA');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic items
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      description: 'Polyester Embroidery Thread 120D/2',
      category: 'YARN_DHAGA',
      qty: 50,
      unit: 'KG',
      rate: 280,
      taxable_amount: 14000,
      gst_rate: 12,
      gst_amount: 1680,
      total: 15680,
    },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        category,
        qty: 1,
        unit: 'KG',
        rate: 0,
        taxable_amount: 0,
        gst_rate: 12,
        gst_amount: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      const gstRate = Number(item.gst_rate || 0);

      if (field === 'qty' || field === 'rate' || field === 'gst_rate') {
        item.taxable_amount = Number((qty * rate).toFixed(2));
        item.gst_amount = Number(((item.taxable_amount * gstRate) / 100).toFixed(2));
        item.total = Number((item.taxable_amount + item.gst_amount).toFixed(2));
      }

      updated[index] = item;
      return updated;
    });
  };

  const totalSubtotal = items.reduce((sum, it) => sum + Number(it.taxable_amount || 0), 0);
  const totalGst = items.reduce((sum, it) => sum + Number(it.gst_amount || 0), 0);
  const grandTotal = Number((totalSubtotal + totalGst).toFixed(2));
  const pendingAmount = Number((grandTotal - Number(paidAmount || 0)).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    if (!invoiceNo.trim()) {
      toast.error('Invoice number is required');
      return;
    }
    if (items.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    setSubmitting(true);
    try {
      await PurchasesApi.create({
        supplier_name: supplierName.trim(),
        supplier_gstin: supplierGstin.trim() || undefined,
        supplier_phone: supplierPhone.trim() || undefined,
        invoice_no: invoiceNo.trim(),
        invoice_date: invoiceDate,
        category,
        payment_status: paymentStatus,
        payment_mode: paymentMode,
        items,
        subtotal: totalSubtotal,
        gst_amount: totalGst,
        net_amount: grandTotal,
        paid_amount: Number(paidAmount || 0),
        notes: notes.trim() || undefined,
      });

      toast.success(`Purchase Invoice ${invoiceNo} recorded successfully`);
      instance.onSuccess?.();
      closeDrawer();
    } catch (err: any) {
      toast.error('Failed to save purchase: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title="Record Purchase Invoice"
      subtitle="Raw materials, Yarn/Dhaga, Badla, Needles, Oil & Spares"
      icon={<ShoppingBag className="w-5 h-5 text-slate-700" />}
      size="xl"
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
            <span>{submitting ? 'Saving...' : 'Save Purchase Bill'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier & Bill Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Supplier / Mill Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ambaji Thread Mill"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-xs font-medium focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Supplier GSTIN
            </label>
            <input
              type="text"
              placeholder="24AAAAA0000A1Z5"
              value={supplierGstin}
              onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-xs font-mono uppercase focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Supplier Phone
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
            />
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Supplier Invoice No *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. INV-2026-99"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Invoice Date *
            </label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs focus:outline-hidden"
            >
              <option value="YARN_DHAGA">Yarn / Dhaga / Zari</option>
              <option value="SPARE_PARTS">Machine Spare Parts</option>
              <option value="CONSUMABLES">Needles & Lubricants</option>
              <option value="PACKAGING">Packaging</option>
              <option value="RAW_MATERIAL">Raw Fabric / Grey</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs focus:outline-hidden"
            >
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
            </select>
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
              Purchased Items / Raw Materials ({items.length})
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-xs font-semibold rounded transition inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)]">
                  <th className="p-2">Item Description</th>
                  <th className="p-2 w-20 text-right">Qty</th>
                  <th className="p-2 w-20">Unit</th>
                  <th className="p-2 w-24 text-right">Rate (₹)</th>
                  <th className="p-2 w-20 text-right">GST %</th>
                  <th className="p-2 w-28 text-right">Total (₹)</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.map((item, idx) => (
                  <tr key={idx} className="bg-[var(--bg-surface)]">
                    <td className="p-1.5">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Zari Yarn Gold 120D"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded text-xs focus:outline-hidden"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded text-xs font-mono text-right focus:outline-hidden"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full px-1.5 py-1 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded text-xs focus:outline-hidden"
                      >
                        <option value="KG">KG</option>
                        <option value="Cones">Cones</option>
                        <option value="Boxes">Boxes</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Liters">Liters</option>
                        <option value="Meters">Meters</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded text-xs font-mono text-right focus:outline-hidden"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={item.gst_rate}
                        onChange={(e) => handleItemChange(idx, 'gst_rate', Number(e.target.value))}
                        className="w-full px-1.5 py-1 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded text-xs text-right focus:outline-hidden"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="p-1.5 text-right font-mono font-semibold text-[var(--text-main)]">
                      {formatINR(item.total)}
                    </td>
                    <td className="p-1.5 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary & Payment */}
        <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[var(--text-muted)] text-[0.6875rem] uppercase font-semibold block">Taxable Subtotal</span>
              <span className="text-sm font-bold font-mono text-[var(--text-main)]">{formatINR(totalSubtotal)}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[0.6875rem] uppercase font-semibold block">GST Amount</span>
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatINR(totalGst)}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[0.6875rem] uppercase font-semibold block">Grand Total</span>
              <span className="text-base font-bold font-mono text-[var(--text-main)]">{formatINR(grandTotal)}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[0.6875rem] uppercase font-semibold block">Pending Balance</span>
              <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">{formatINR(pendingAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
            <div>
              <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-xs focus:outline-hidden"
              >
                <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Notes / Delivery Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Received at godown 2, invoice verified by supervisor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-xs focus:outline-hidden"
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 23. View Purchase Invoice Drawer Form                                     */
/* -------------------------------------------------------------------------- */
export const ViewPurchaseDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const purchase = instance.payload?.purchase as PurchaseApiItem | undefined;

  if (!purchase) return null;

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={`Bill #${purchase.invoice_no}`}
      subtitle={`${purchase.supplier_name} • ${purchase.invoice_date}`}
      icon={<ShoppingBag className="w-5 h-5 text-slate-700" />}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Top Bento Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <span className="text-[var(--text-muted)] text-[0.625rem] font-semibold uppercase block">Taxable</span>
            <span className="text-sm font-bold font-mono">{formatINR(purchase.subtotal)}</span>
          </div>
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <span className="text-[var(--text-muted)] text-[0.625rem] font-semibold uppercase block">GST Input</span>
            <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatINR(purchase.gst_amount)}
            </span>
          </div>
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <span className="text-[var(--text-muted)] text-[0.625rem] font-semibold uppercase block">Total Bill</span>
            <span className="text-sm font-bold font-mono text-[var(--text-main)]">
              {formatINR(purchase.net_amount)}
            </span>
          </div>
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <span className="text-[var(--text-muted)] text-[0.625rem] font-semibold uppercase block">Pending</span>
            <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatINR(purchase.net_amount - purchase.paid_amount)}
            </span>
          </div>
        </div>

        {/* Supplier Details */}
        <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg space-y-1">
          <div className="font-bold text-sm text-[var(--text-main)]">{purchase.supplier_name}</div>
          <div className="text-[var(--text-muted)] flex flex-wrap gap-3 font-mono text-[0.6875rem]">
            <span>GSTIN: {purchase.supplier_gstin || 'Unregistered'}</span>
            {purchase.supplier_phone && <span>Phone: {purchase.supplier_phone}</span>}
            <span>Category: {purchase.category}</span>
            <span>Payment: {purchase.payment_mode}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)]">
                <th className="p-2.5">Item Description</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5">Unit</th>
                <th className="p-2.5 text-right">Rate</th>
                <th className="p-2.5 text-right">GST</th>
                <th className="p-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(purchase.items || []).map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2.5 font-medium">{it.description}</td>
                  <td className="p-2.5 text-right font-mono">{it.qty}</td>
                  <td className="p-2.5">{it.unit}</td>
                  <td className="p-2.5 text-right font-mono">{formatINR(it.rate)}</td>
                  <td className="p-2.5 text-right font-mono text-emerald-600">{it.gst_rate}%</td>
                  <td className="p-2.5 text-right font-mono font-bold">{formatINR(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {purchase.notes && (
          <div className="p-2.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded text-[var(--text-muted)] text-[0.6875rem]">
            <span className="font-semibold text-[var(--text-main)]">Remarks: </span>
            {purchase.notes}
          </div>
        )}
      </div>
    </Drawer>
  );
};
