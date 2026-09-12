'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { OutwardInvoicesApi, OutwardInvoiceApiItem } from '@/lib/api/invoices';
import { generateTallyPrimeSalesXML } from '@/lib/tally-xml-generator';
import { InvoiceSAC9988 } from '@/lib/types';
import { toast } from 'sonner';
import { ReceiptText, Download, RefreshCw } from 'lucide-react';

export const SacInvoicingTallyDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();

  const [invoices, setInvoices] = useState<OutwardInvoiceApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState(instance.payload?.invoiceNo || '');
  const [partyName, setPartyName] = useState(instance.payload?.partyName || '');
  const [partyGstin, setPartyGstin] = useState('24AABCR1234F1Z1');
  const [lotNumber, setLotNumber] = useState('LOT-2026-F902');
  const [fabricQuality, setFabricQuality] = useState('60-Gram Georgette');
  const [taxableAmount, setTaxableAmount] = useState<number>(42000);
  const isInterState = false; // Intra Gujarat: 2.5% CGST + 2.5% SGST

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      try {
        const list = await OutwardInvoicesApi.getAll();
        const rawList = Array.isArray(list) ? list : [];
        setInvoices(rawList);

        if (rawList.length > 0) {
          const match = rawList.find((inv) => inv.id === instance.payload?.invoiceId || inv.invoice_no === instance.payload?.invoiceNo) || rawList[0];
          setSelectedInvoiceId(match.id);
          setInvoiceNo(match.invoice_no || `INV-${match.id.substring(0, 6)}`);
          setPartyName(match.trader_name || 'Shree Ganesh Fab');
          if (match.trader_gstin) setPartyGstin(match.trader_gstin);
          const firstLot = match.lot_items?.[0];
          if (firstLot?.lot_no) setLotNumber(firstLot.lot_no);
          else if (match.inward_challan?.challan_no) setLotNumber(match.inward_challan.challan_no);
          
          if (firstLot?.fabric_quality) setFabricQuality(firstLot.fabric_quality);
          else if (match.inward_challan?.fabric_quality) setFabricQuality(match.inward_challan.fabric_quality);
          
          if (match.gross_amount) {
            setTaxableAmount(Number(match.gross_amount));
          }
        }
      } catch (err) {
        console.warn('Invoices load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [instance.payload?.invoiceId, instance.payload?.invoiceNo]);

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const chosen = invoices.find((inv) => inv.id === invId);
    if (chosen) {
      setInvoiceNo(chosen.invoice_no || `INV-${chosen.id.substring(0, 6)}`);
      setPartyName(chosen.trader_name || 'Shree Ganesh Fab');
      if (chosen.trader_gstin) setPartyGstin(chosen.trader_gstin);
      const firstLot = chosen.lot_items?.[0];
      if (firstLot?.lot_no) setLotNumber(firstLot.lot_no);
      else if (chosen.inward_challan?.challan_no) setLotNumber(chosen.inward_challan.challan_no);
      
      if (firstLot?.fabric_quality) setFabricQuality(firstLot.fabric_quality);
      else if (chosen.inward_challan?.fabric_quality) setFabricQuality(chosen.inward_challan.fabric_quality);

      if (chosen.gross_amount) {
        setTaxableAmount(Number(chosen.gross_amount));
      }
    }
  };

  const cgst = isInterState ? 0 : Number((taxableAmount * 0.025).toFixed(2));
  const sgst = isInterState ? 0 : Number((taxableAmount * 0.025).toFixed(2));
  const igst = isInterState ? Number((taxableAmount * 0.05).toFixed(2)) : 0;
  const grandTotal = Math.round(taxableAmount + cgst + sgst + igst);

  const handleExportTallyXml = () => {
    const invoiceRecord: InvoiceSAC9988 = {
      id: selectedInvoiceId || 'INV-001',
      invoiceNumber: invoiceNo,
      invoiceDate: new Date().toISOString().slice(0, 10),
      traderName: partyName,
      traderGstin: partyGstin,
      traderMobile: '9825000000',
      traderAddress: 'Ring Road, Surat, Gujarat',
      lotNumber: lotNumber,
      fabricQuality: fabricQuality,
      numberOfTakas: 10,
      totalStitches: 384000,
      headCount: 32,
      ratePerThousand: 0.45,
      meters: 975,
      baseAmount: taxableAmount,
      gstRate: 5,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      isInterstate: isInterState,
      totalAmount: grandTotal,
      sacCode: '9988',
      paymentStatus: 'unpaid',
      whatsappDispatched: false,
      tallySynced: true,
      termsCondition: 'Standard Surat Textile Market Terms Apply',
    };

    const xmlContent = generateTallyPrimeSalesXML('Surat Embroidery Unit', [invoiceRecord]);
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TALLY_${invoiceNo}.xml`;
    a.click();
    toast.success(`${t.sacTally_title || 'Tally XML'}: ${invoiceNo} XML exported successfully`);
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.sacTally_title || 'SAC 9988 GST Invoicing & Tally Prime 4.0 XML'}
      subtitle={t.sacTally_subtitle || 'Direct job-work tax computation (2.5% + 2.5% / 5%) & Tally envelope export'}
      icon={<ReceiptText className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={handleExportTallyXml}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.sacTally_btnGenerate || 'Export Tally XML'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading live outward invoice records...</span>
          </div>
        )}

        {/* Live Invoices Selector */}
        {invoices.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Select Outward GST Invoice</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-semibold"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_no} — {inv.trader_name} (₹{Number(inv.net_amount || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Invoice Number</label>
            <input
              type="text"
              readOnly
              value={invoiceNo}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">SAC HSN Code</label>
            <input
              type="text"
              readOnly
              value="9988 (Job Work 5% GST)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Trader / Party Name</label>
          <input
            type="text"
            readOnly
            value={partyName}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Taxable Job Work Base (INR)</label>
          <input
            type="number"
            value={taxableAmount}
            onChange={(e) => setTaxableAmount(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums"
          />
        </div>

        {/* Dynamic GST & Tally Breakdown */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-sans">Taxable Base Amount:</span>
            <span className="font-bold text-slate-900">₹{taxableAmount.toLocaleString('en-IN')}</span>
          </div>
          {!isInterState ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-sans">CGST @ 2.5%:</span>
                <span className="font-bold text-slate-900">₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-sans">SGST @ 2.5%:</span>
                <span className="font-bold text-slate-900">₹{sgst.toLocaleString('en-IN')}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-sans">IGST @ 5.0%:</span>
              <span className="font-bold text-slate-900">₹{igst.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-base pt-2 border-t border-slate-200 font-bold">
            <span className="font-sans text-slate-900">Invoice Grand Total:</span>
            <span className="text-slate-900">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
