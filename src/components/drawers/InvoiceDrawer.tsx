'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { OutwardInvoicesApi } from '@/lib/api/invoices';
import { PartiesApi, PartyApiItem } from '@/lib/api/parties';
import { WhatsappApi } from '@/lib/api/whatsapp';
import { PartyPicker } from '@/components/molecules/PartyPicker';
import { formatINR } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Download,
  Share2,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 8. Invoice Drawer Form (Create / Edit SAC 9988 Bill & Multi-Item Billing)   */
/* -------------------------------------------------------------------------- */
interface InvoiceLineItem {
  id: string;
  item_name: string;
  description: string;
  stitch_count: number;
  machine_heads: number;
  rate_per_1000: number;
  taxable_amount: number;
  meters?: number;
  inward_challan_id?: string;
  lot_no?: string;
  source?: 'LOG_DATA' | 'INWARD_LOT' | 'CUSTOM';
  log_count?: number;
}

export const InvoiceDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer, openDrawer } = useAppDrawer();
  const { t } = useI18n();

  const isEditing = Boolean(instance.payload?.isEditing || instance.type === 'EDIT_INVOICE');
  const editingInvoice = instance.payload?.invoice;

  const [parties, setParties] = useState<PartyApiItem[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  const [traderName, setTraderName] = useState(editingInvoice?.trader_name || '');
  const [traderGstin, setTraderGstin] = useState(editingInvoice?.trader_gstin || '');
  const [invoiceDate, setInvoiceDate] = useState(
    editingInvoice?.invoice_date || new Date().toISOString().split('T')[0]
  );
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: 'item-1',
      item_name: 'Border Embroidery Jobwork',
      description: 'SAC 9988 multi-head embroidery work',
      stitch_count: 24000,
      machine_heads: 32,
      rate_per_1000: 0.60,
      taxable_amount: 461,
      meters: 500,
      source: 'CUSTOM',
    },
  ]);
  const [taxRate] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);

  // Helper: map selected challans into structured line items with respective designs & description
  const syncItemsFromLots = (lotIds: string[], allChallans: InwardChallanApiItem[]) => {
    const chosen = allChallans.filter((c) => lotIds.includes(c.id));
    if (chosen.length === 0) {
      setLineItems([
        {
          id: `item-1`,
          item_name: 'Direct Jobwork Embroidery',
          description: 'SAC 9988 embroidery on cloth',
          stitch_count: 24000,
          machine_heads: 32,
          rate_per_1000: 0.60,
          taxable_amount: Math.round((24000 * 32 * 0.60) / 1000),
          meters: 500,
          source: 'CUSTOM',
        },
      ]);
      return;
    }

    const items: InvoiceLineItem[] = [];
    for (const c of chosen) {
      const summary = c.production_summary || {};
      const shiftLogs = (c as any).shiftLogs || (c as any).shift_logs || [];

      if (c.items && c.items.length > 0) {
        for (const it of c.items) {
          const designCode = (it.design_no || 'Standard').trim();
          const prodInfo = summary[designCode] || summary[it.design_no];
          let loggedStitches = prodInfo?.total_stitches || 0;
          let machineHeads = prodInfo?.machine_heads || 32;
          let logCount = prodInfo?.log_count || 0;

          if (!prodInfo && shiftLogs.length > 0) {
            const matchingLogs = shiftLogs.filter(
              (sl: any) => (sl.design_no || '').trim().toLowerCase() === designCode.toLowerCase()
            );
            if (matchingLogs.length > 0) {
              loggedStitches = matchingLogs.reduce((sum: number, l: any) => sum + Number(l.total_stitches || 0), 0);
              logCount = matchingLogs.length;
              if (matchingLogs[0].machine?.head_count) {
                machineHeads = matchingLogs[0].machine.head_count;
              }
            }
          }

          const hasLogData = loggedStitches > 0;
          const st = hasLogData ? loggedStitches : (it.stitch_count || c.stitch_count || 24000);
          const hd = machineHeads;
          const rt = it.jobwork_price_per_1k || c.jobwork_price_per_1k || 0.60;
          const taxable = Math.round((st * hd * rt) / 1000);
          const meters = hasLogData && prodInfo?.total_meters ? prodInfo.total_meters : (it.meters || c.inward_meters || 500);

          items.push({
            id: `lot-${c.id}-${it.design_no}`,
            item_name: `Design ${it.design_no}`,
            description: `${c.fabric_quality} • Lot #${c.lot_no} • ${meters}m (${it.than_count || 1} Thans)`,
            stitch_count: st,
            machine_heads: hd,
            rate_per_1000: rt,
            taxable_amount: taxable,
            meters: meters,
            inward_challan_id: c.id,
            lot_no: c.lot_no,
            source: hasLogData ? 'LOG_DATA' : 'INWARD_LOT',
            log_count: logCount,
          });
        }
      } else {
        const designCode = (c.design_no || 'Standard').trim();
        const prodInfo = summary[designCode] || (Object.values(summary)[0] as any);
        let loggedStitches = prodInfo?.total_stitches || 0;
        let machineHeads = prodInfo?.machine_heads || 32;
        let logCount = prodInfo?.log_count || 0;

        if (!prodInfo && shiftLogs.length > 0) {
          loggedStitches = shiftLogs.reduce((sum: number, l: any) => sum + Number(l.total_stitches || 0), 0);
          logCount = shiftLogs.length;
          if (shiftLogs[0].machine?.head_count) {
            machineHeads = shiftLogs[0].machine.head_count;
          }
        }

        const hasLogData = loggedStitches > 0;
        const st = hasLogData ? loggedStitches : (c.stitch_count || 24000);
        const hd = machineHeads;
        const rt = c.jobwork_price_per_1k || 0.60;
        const taxable = Math.round((st * hd * rt) / 1000);
        const meters = hasLogData && prodInfo?.total_meters ? prodInfo.total_meters : Number(c.inward_meters || 500);

        items.push({
          id: `lot-${c.id}`,
          item_name: `Lot #${c.lot_no} (${c.design_no || 'Standard'})`,
          description: `${c.fabric_quality} • ${meters}m • ${c.than_count} Thans`,
          stitch_count: st,
          machine_heads: hd,
          rate_per_1000: rt,
          taxable_amount: taxable,
          meters: meters,
          inward_challan_id: c.id,
          lot_no: c.lot_no,
          source: hasLogData ? 'LOG_DATA' : 'INWARD_LOT',
          log_count: logCount,
        });
      }
    }
    setLineItems(items);
  };

  useEffect(() => {
    const prefillChallan = instance.payload?.challan;
    const prefillChallanId = instance.payload?.challanId || prefillChallan?.id;

    InwardChallansApi.getAll()
      .then((data) => {
        setChallans(data);
        if (prefillChallanId) {
          const match = data.find((c) => c.id === prefillChallanId) || prefillChallan;
          if (match) {
            const linkedInv = (match as any)?.outwardInvoices?.[0] || (match as any)?.outward_invoices?.[0];
            if (!isEditing && (linkedInv || match.status === 'DISPATCHED')) {
              toast.info(`Lot #${match.lot_no} is already invoiced. Opening invoice drawer.`);
              closeDrawer();
              openDrawer('VIEW_INVOICE', { invoice: linkedInv, challan: match, challanId: match.id });
              return;
            }
            setSelectedLotIds([match.id]);
            if (match.trader_name) setTraderName(match.trader_name);
            if (match.trader_gstin) setTraderGstin(match.trader_gstin);
            syncItemsFromLots([match.id], data);
          }
        } else if (editingInvoice && editingInvoice.lot_items) {
          setLineItems(
            editingInvoice.lot_items.map((it: any, idx: number) => ({
              id: `edit-item-${idx}`,
              item_name: it.design_no || it.lot_no || `Item #${idx + 1}`,
              description: it.fabric_quality || 'Jobwork Item',
              stitch_count: it.stitch_count || editingInvoice.total_stitches || 24000,
              machine_heads: editingInvoice.machine_heads || 32,
              rate_per_1000: it.rate || editingInvoice.rate_per_1000 || 0.60,
              taxable_amount: it.taxable_amount || Math.round(((it.stitch_count || 24000) * 32 * (it.rate || 0.60)) / 1000),
              meters: it.meters || 500,
              lot_no: it.lot_no,
              inward_challan_id: it.inward_challan_id,
            }))
          );
        }
      })
      .catch((e) => console.warn('Failed to load challans in invoice drawer:', e));

    PartiesApi.getAll()
      .then((data) => {
        setParties(data);
        if (prefillChallan?.trader_name) {
          const matchedParty = data.find(
            (p) =>
              p.name.toLowerCase() === prefillChallan.trader_name.toLowerCase() ||
              (p.gstin && prefillChallan.trader_gstin && p.gstin.toUpperCase() === prefillChallan.trader_gstin.toUpperCase())
          );
          if (matchedParty) {
            setSelectedPartyId(matchedParty.id);
            setTraderName(matchedParty.name);
            if (matchedParty.gstin) setTraderGstin(matchedParty.gstin);
          } else {
            setTraderName(prefillChallan.trader_name);
            if (prefillChallan.trader_gstin) setTraderGstin(prefillChallan.trader_gstin);
          }
        } else if (editingInvoice?.trader_name) {
          const matchedParty = data.find((p) => p.name.toLowerCase() === editingInvoice.trader_name.toLowerCase());
          if (matchedParty) setSelectedPartyId(matchedParty.id);
        } else if (data.length > 0 && !traderName) {
          setSelectedPartyId(data[0].id);
          setTraderName(data[0].name);
          if (data[0].gstin) setTraderGstin(data[0].gstin);
        }
      })
      .catch(() => {});
  }, [instance.payload]);

  const partyLots = challans.filter((c) => {
    if (!traderName.trim()) return false;
    const matchesParty = (c as any).party_id && (c as any).party_id === selectedPartyId;
    const matchesName = c.trader_name.toLowerCase().trim() === traderName.toLowerCase().trim();
    const matchesGstin = traderGstin && c.trader_gstin && c.trader_gstin.toUpperCase() === traderGstin.toUpperCase();
    const invList = (c as any).outwardInvoices || c.outward_invoices || [];
    const isUnbilled =
      (invList.length === 0 && c.status !== 'DISPATCHED') ||
      (isEditing && invList.some((inv: any) => inv.id === editingInvoice?.id));
    return (matchesParty || matchesName || matchesGstin) && isUnbilled;
  });

  const handlePartySelect = (p: { id?: string; name: string; gstin?: string; mobile?: string }) => {
    setSelectedPartyId(p.id || '');
    setTraderName(p.name);
    if (p.gstin) setTraderGstin(p.gstin);
    setSelectedLotIds([]);
    syncItemsFromLots([], challans);
  };

  const handleToggleLot = (lotId: string) => {
    setSelectedLotIds((prev) => {
      const next = prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId];
      syncItemsFromLots(next, challans);
      return next;
    });
  };

  const handleSelectAllLots = () => {
    if (selectedLotIds.length === partyLots.length) {
      setSelectedLotIds([]);
      syncItemsFromLots([], challans);
    } else {
      const allIds = partyLots.map((c) => c.id);
      setSelectedLotIds(allIds);
      syncItemsFromLots(allIds, challans);
    }
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        item_name: `Job Work Item ${prev.length + 1}`,
        description: 'Multi-head embroidery on cloth',
        stitch_count: 24000,
        machine_heads: 32,
        rate_per_1000: 0.60,
        taxable_amount: Math.round((24000 * 32 * 0.60) / 1000),
        meters: 500,
      },
    ]);
  };

  const updateLineItem = (idx: number, field: keyof InvoiceLineItem, val: any) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const cur = { ...copy[idx], [field]: val };
      if (field === 'stitch_count' || field === 'machine_heads' || field === 'rate_per_1000') {
        const st = field === 'stitch_count' ? Number(val) : cur.stitch_count;
        const hd = field === 'machine_heads' ? Number(val) : cur.machine_heads;
        const rt = field === 'rate_per_1000' ? Number(val) : cur.rate_per_1000;
        cur.taxable_amount = Math.round((st * hd * rt) / 1000);
      }
      copy[idx] = cur;
      return copy;
    });
  };

  const removeLineItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const taxableAmount = lineItems.reduce((acc, it) => acc + Number(it.taxable_amount || 0), 0);
  const gstAmount = Math.round(taxableAmount * (taxRate / 100));
  const netAmount = taxableAmount + gstAmount;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderName.trim()) {
      toast.error('Trader name is required');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('At least one item is required in the invoice');
      return;
    }
    setSubmitting(true);
    try {
      const lotItemsPayload = lineItems.map((it) => ({
        inward_challan_id: it.inward_challan_id,
        lot_no: it.lot_no || it.item_name,
        meters: it.meters || 0,
        fabric_quality: it.description,
        design_no: it.item_name,
        rate: it.rate_per_1000,
        taxable_amount: it.taxable_amount,
        stitch_count: it.stitch_count,
        machine_heads: it.machine_heads,
      }));

      const totalStitches = lineItems.reduce((acc, it) => acc + Number(it.stitch_count || 0), 0);
      const totalMeters = lineItems.reduce((acc, it) => acc + Number(it.meters || 0), 0);

      const payload = {
        trader_name: traderName,
        trader_gstin: traderGstin,
        invoice_date: invoiceDate,
        inward_challan_id: selectedLotIds.length > 0 ? selectedLotIds[0] : undefined,
        lot_items: lotItemsPayload,
        total_stitches: totalStitches || 24000,
        machine_heads: lineItems[0]?.machine_heads || 32,
        rate_per_1000: lineItems[0]?.rate_per_1000 || 0.60,
        inward_meters: totalMeters || 1000,
        outward_meters: totalMeters || 1000,
      };

      let result;
      if (isEditing && editingInvoice?.id) {
        result = await OutwardInvoicesApi.update(editingInvoice.id, payload);
        toast.success(`SAC 9988 Invoice ${editingInvoice.invoice_no || ''} updated successfully!`);
      } else {
        result = await OutwardInvoicesApi.create(payload);
        toast.success(`SAC 9988 Invoice generated successfully!`);
      }

      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} invoice: ` + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={isEditing ? 'Edit SAC 9988 Outward Bill' : t.invoice_drawerTitle}
      subtitle={isEditing ? `Modifying Invoice #${editingInvoice?.invoice_no}` : t.invoice_drawerSubtitle}
      icon={<FileText className="w-5 h-5 text-slate-700" />}
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`invoice-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? t.saving : isEditing ? 'Update Invoice' : t.invoice_btnGenerate}
          </button>
        </div>
      }
    >
      <form id={`invoice-form-${instance.id}`} onSubmit={handleCreateInvoice} className="space-y-4">
        <PartyPicker
          selectedPartyId={selectedPartyId}
          partyName={traderName}
          partyGstin={traderGstin}
          label={t.invoice_labelTrader}
          onSelect={handlePartySelect}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.invoice_labelGstin}</label>
            <input
              type="text"
              placeholder="24BBCDE5678G1Z3"
              value={traderGstin}
              onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.invoice_labelDate}</label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        {/* Multi-Challan Selection */}
        <div className="p-4 bg-[var(--bg-surface-elevated)]/50 border border-[var(--border)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-2xs font-bold uppercase tracking-wider text-[var(--text-main)] block">
                {t.invoice_multiLotTitle}
              </span>
              <span className="text-3xs text-slate-500">
                {partyLots.length} available unbilled challan(s) for {traderName || 'Selected Party'}
              </span>
            </div>
            {partyLots.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllLots}
                className="text-xs font-semibold text-[var(--primary)] hover:text-[#9494ff] bg-white px-2.5 py-1 rounded-md border border-[var(--border)] shadow-2xs cursor-pointer"
              >
                {selectedLotIds.length === partyLots.length ? 'Deselect All Lots' : `Select All (${partyLots.length})`}
              </button>
            )}
          </div>

          {partyLots.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {partyLots.map((c) => {
                const isSelected = selectedLotIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? 'bg-white border-[var(--primary)] shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleLot(c.id)}
                      className="w-4 h-4 mt-0.5 text-[var(--primary)] rounded border-slate-300"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">Lot #{c.lot_no}</span>
                        <span className="font-mono font-bold text-emerald-700">{c.inward_meters} m</span>
                      </div>
                      <div className="text-2xs text-slate-600 flex items-center gap-2 pt-0.5">
                        <span>{c.fabric_quality}</span>
                        {c.design_no && <span className="font-mono text-[var(--text-main)] font-semibold">• {c.design_no}</span>}
                        <span>• {c.than_count} Thans</span>
                        {c.items && c.items.length > 1 && (
                          <span className="badge-pastel-blue px-1.5 py-0.2 text-3xs font-semibold rounded">
                            {c.items.length} Designs
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 text-center">
              No unbilled inward challans found for this party. Fill the item fields below for direct billing.
            </div>
          )}
        </div>

        {/* Dynamic Multi-Item Line Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden space-y-2">
          <div className="p-3 bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Billed Items Breakdown ({lineItems.length})
            </span>
            <button
              type="button"
              onClick={addLineItem}
              className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.invoice_addItem || '+ Add Item'}</span>
            </button>
          </div>

          <div className="p-3 space-y-3">
            {lineItems.map((item, idx) => (
              <div key={item.id || idx} className="p-3 bg-[var(--bg-surface-elevated)]/40 border border-[var(--border)] rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-3xs text-[var(--text-muted)] font-medium block">Item / Design Name</label>
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => updateLineItem(idx, 'item_name', e.target.value)}
                        className="w-full bg-white border border-[var(--border)] rounded px-2 py-1 text-xs font-medium text-[var(--text-main)]"
                        placeholder="e.g. Design 108"
                      />
                    </div>
                    <div>
                      <label className="text-3xs text-[var(--text-muted)] font-medium block">Description / Fabric Quality</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        className="w-full bg-white border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-main)]"
                        placeholder="e.g. Georgette 60g 500m"
                      />
                    </div>
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded mt-3 cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <label className="text-3xs text-[var(--text-muted)] font-medium block">Stitch Count</label>
                      {item.source === 'LOG_DATA' ? (
                        <span
                          className="px-1 py-0.2 rounded text-3xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-0.5"
                          title={`Auto-aggregated from ${item.log_count || 1} production shift telemetry logs`}
                        >
                          🟢 Log Data
                        </span>
                      ) : item.source === 'INWARD_LOT' ? (
                        <span
                          className="px-1 py-0.2 rounded text-3xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-0.5"
                          title="Auto-populated from Inward Lot item design specification"
                        >
                          🔵 Lot Spec
                        </span>
                      ) : null}
                    </div>
                    <input
                      type="number"
                      value={item.stitch_count}
                      onChange={(e) => updateLineItem(idx, 'stitch_count', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-[var(--border)] rounded px-2 py-1 text-xs font-mono text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <label className="text-3xs text-[var(--text-muted)] font-medium block">Machine Heads</label>
                    <input
                      type="number"
                      value={item.machine_heads}
                      onChange={(e) => updateLineItem(idx, 'machine_heads', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-[var(--border)] rounded px-2 py-1 text-xs font-mono text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <label className="text-3xs text-[var(--text-muted)] font-medium block">Rate / 1k (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate_per_1000}
                      onChange={(e) => updateLineItem(idx, 'rate_per_1000', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-[var(--border)] rounded px-2 py-1 text-xs font-mono text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <label className="text-3xs text-[var(--text-muted)] font-medium block">Finished Meters</label>
                    <input
                      type="number"
                      value={item.meters || 0}
                      onChange={(e) => updateLineItem(idx, 'meters', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-[var(--border)] rounded px-2 py-1 text-xs font-mono text-[var(--text-main)]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-3xs text-[var(--text-muted)] font-medium block">Taxable Base (₹)</label>
                    <input
                      type="number"
                      value={item.taxable_amount}
                      onChange={(e) => updateLineItem(idx, 'taxable_amount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-emerald-50/50 border border-emerald-300 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GST Tax Breakdown Card */}
        <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-600 block">
            {t.invoice_calcBreakdownTitle}
          </span>

          <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>{t.invoice_taxableValue}</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(taxableAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>GST 5% (CGST 2.5% + SGST 2.5%)</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(gstAmount)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-900 pt-1 border-t border-slate-300">
              <span>{t.invoice_netPayable}</span>
              <span className="font-mono text-emerald-700 text-sm">{formatINR(netAmount)}</span>
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 8b. View Invoice Drawer Form (Inspect, Edit, Print PDF & WhatsApp)         */
/* -------------------------------------------------------------------------- */
export const ViewInvoiceDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer, openDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [sendingWa, setSendingWa] = useState(false);
  const initialInvoice =
    instance.payload?.invoice ||
    (instance.payload?.challan as any)?.outwardInvoices?.[0] ||
    (instance.payload?.challan as any)?.outward_invoices?.[0] ||
    null;
  const [invoice, setInvoice] = useState<any>(initialInvoice);
  const [loading, setLoading] = useState(!initialInvoice && Boolean(instance.payload?.invoiceId || instance.payload?.challanId));

  useEffect(() => {
    const invId = instance.payload?.invoiceId || instance.payload?.invoice?.id;
    if (invId && (!invoice || !invoice.trader_mobile)) {
      setLoading(!invoice);
      OutwardInvoicesApi.getById(invId)
        .then((data) => {
          if (data) setInvoice(data);
        })
        .catch((e) => console.warn('Failed to load invoice in drawer:', e))
        .finally(() => setLoading(false));
    } else if (!invoice && instance.payload?.challanId) {
      const cId = instance.payload.challanId;
      setLoading(true);
      OutwardInvoicesApi.getAll({ inward_challan_id: cId })
        .then((invs) => {
          if (invs && invs.length > 0) {
            setInvoice(invs[0]);
          } else {
            return InwardChallansApi.getById(cId).then((ch: any) => {
              const inv = ch?.outwardInvoices?.[0] || ch?.outward_invoices?.[0];
              if (inv) setInvoice(inv);
            });
          }
        })
        .catch((e) => console.warn('Failed to load invoice for challan:', e))
        .finally(() => setLoading(false));
    }
  }, [instance.payload?.invoiceId, instance.payload?.challanId, instance.payload?.invoice?.id]);

  if (loading) {
    return (
      <Drawer
        isOpen={true}
        onClose={closeDrawer}
        level={level}
        title="Tax Invoice Viewer"
        subtitle="Loading invoice details..."
        icon={<FileText className="w-5 h-5 text-slate-700" />}
        size="lg"
      >
        <div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading invoice data...</div>
      </Drawer>
    );
  }

  if (!invoice) return null;

  const handleSendWhatsApp = async () => {
    setSendingWa(true);
    try {
      const traderMobile = invoice.trader_mobile || (invoice as any).party?.mobile;
      const res = await WhatsappApi.sendInvoicePdf(invoice.id, {
        phone: traderMobile || undefined,
        caption: `Tax Invoice ${invoice.invoice_no} for ${invoice.trader_name}. Total Net: ${formatINR(invoice.net_amount || 0)}`,
      });
      const displayPhone = res?.recipient?.phone || traderMobile || 'registered mobile';
      if (res?.isFallback) {
        toast.warning(res?.message || 'WhatsApp Gateway offline; opened web fallback.');
        if (res?.fallbackUrl) {
          window.open(res.fallbackUrl, '_blank');
        }
      } else {
        toast.success(res?.message || `Tax Invoice ${invoice.invoice_no} PDF sent to ${invoice.trader_name} (${displayPhone}) via WhatsApp!`);
      }
    } catch (err: any) {
      toast.error('Failed to send WhatsApp document: ' + err.message);
    } finally {
      setSendingWa(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await OutwardInvoicesApi.downloadPdf(invoice.id, invoice.invoice_no || 'invoice');
      toast.success('Downloaded invoice PDF');
    } catch (err: any) {
      toast.error('Download failed: ' + err.message);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={`Tax Invoice: ${invoice.invoice_no}`}
      subtitle={`${invoice.trader_name} • ${invoice.invoice_date || ''}`}
      icon={<FileText className="w-5 h-5 text-slate-700" />}
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              closeDrawer();
              openDrawer('EDIT_INVOICE', { invoice, isEditing: true });
            }}
            className="w-1/4 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            title="Edit Invoice particulars and rates"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Invoice</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-1/4 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            title="Download / Print SAC 9988 GST Tax Invoice PDF"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Print PDF</span>
          </button>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={sendingWa}
            className="w-1/4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            title="Send PDF document directly to trader mobile via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{sendingWa ? 'Sending...' : 'Send WhatsApp'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Summary Banner */}
        <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl flex items-center justify-between">
          <div>
            <div className="text-3xs text-[var(--text-muted)] font-semibold uppercase">Total Net Payable</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatINR(invoice.net_amount || 0)}
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="badge-pastel-green px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold">
              SAC {invoice.sac_code || '9988'}
            </span>
            <div className="text-[var(--text-muted)] text-3xs mt-1">
              GST 5% Tax Invoice
            </div>
          </div>
        </div>

        {/* Invoice Info Card */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-3">
          <div className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Party & Billing Information</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Invoice No</span>
              <span className="font-mono font-bold text-[var(--text-main)]">{invoice.invoice_no}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Invoice Date</span>
              <span className="font-mono text-[var(--text-main)]">{invoice.invoice_date}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Trader Name</span>
              <span className="font-semibold text-[var(--text-main)]">{invoice.trader_name}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Trader GSTIN</span>
              <span className="font-mono text-[var(--text-main)]">{invoice.trader_gstin || 'Unregistered'}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Trader Mobile</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {invoice.trader_mobile || (invoice as any).party?.mobile
                  ? `+91 ${invoice.trader_mobile || (invoice as any).party?.mobile}`
                  : 'Not registered'}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Machine Heads</span>
              <span className="font-mono text-[var(--text-main)]">{invoice.machine_heads || 32} Heads</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Stitch Rate</span>
              <span className="font-mono text-[var(--text-main)]">₹{invoice.rate_per_1000}/1k St.</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        {(() => {
          const rawLotItems = invoice.lot_items;
          const hasValidLotItems =
            Array.isArray(rawLotItems) &&
            rawLotItems.length > 0 &&
            rawLotItems.some(
              (it: any) =>
                it &&
                !Array.isArray(it) &&
                (it.lot_no || it.design_no || (it.meters && Number(it.meters) > 0)),
            );

          const itemsToRender = hasValidLotItems
            ? rawLotItems.filter((it: any) => it && !Array.isArray(it))
            : (invoice.inwardChallan?.items &&
               invoice.inwardChallan.items.length > 0)
            ? invoice.inwardChallan.items.map((ci: any) => ({
                lot_no: invoice.inwardChallan.lot_no,
                design_no: ci.design_no,
                fabric_quality: invoice.inwardChallan.fabric_quality,
                meters: ci.meters,
                thans: ci.than_count,
                stitch_count: ci.stitch_count,
                rate: ci.jobwork_price_per_1k || invoice.rate_per_1000,
                machine_heads: invoice.machine_heads,
                taxable_amount: Math.round(
                  ((Number(ci.stitch_count || 24000) *
                    Number(invoice.machine_heads || 32) *
                    Number(ci.jobwork_price_per_1k || invoice.rate_per_1000 || 0.6)) /
                    1000),
                ),
              }))
            : [
                {
                  lot_no: invoice.inwardChallan?.lot_no || 'Lot #1',
                  design_no:
                    invoice.inwardChallan?.design_no || 'Standard Jobwork',
                  fabric_quality:
                    invoice.inwardChallan?.fabric_quality || 'Embroidery Fabric',
                  meters: invoice.outward_meters || invoice.inward_meters,
                  thans: invoice.inwardChallan?.than_count || 1,
                  stitch_count: invoice.total_stitches,
                  machine_heads: invoice.machine_heads,
                  rate: invoice.rate_per_1000,
                  taxable_amount: invoice.gross_amount,
                },
              ];

          return (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
              <div className="p-3 bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                  Billed Items / Lots ({itemsToRender.length})
                </span>
                <span className="text-3xs text-[var(--text-muted)] font-mono">
                  SAC {invoice.sac_code || '9988'} • Job-Work
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[var(--text-muted)] border-b border-[var(--border)] text-3xs uppercase bg-[var(--bg-surface-elevated)]/50">
                    <tr>
                      <th className="p-3">Lot No</th>
                      <th className="p-3">Design & Fabric</th>
                      <th className="p-3 text-right">Meters / Thans</th>
                      <th className="p-3 text-right">Stitches & Heads</th>
                      <th className="p-3 text-right">Rate / 1k</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {itemsToRender.map((it: any, idx: number) => {
                      const itStitches = Number(
                        it.stitch_count || invoice.total_stitches || 24000,
                      );
                      const itHeads = Number(
                        it.machine_heads || invoice.machine_heads || 32,
                      );
                      const itRate = Number(
                        it.rate || invoice.rate_per_1000 || 0.6,
                      );
                      const itAmount =
                        it.taxable_amount != null
                          ? Number(it.taxable_amount)
                          : Math.round((itStitches * itHeads * itRate) / 1000);

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-[var(--bg-surface-elevated)]/40 transition"
                        >
                          <td className="p-3 font-mono font-semibold text-[var(--text-main)] align-top">
                            {it.lot_no ||
                              invoice.inwardChallan?.lot_no ||
                              `Lot #${idx + 1}`}
                          </td>
                          <td className="p-3 text-[var(--text-main)] align-top">
                            <div className="font-semibold text-[var(--text-main)]">
                              {it.design_no ||
                                invoice.inwardChallan?.design_no ||
                                'Standard Jobwork'}
                            </div>
                            <div className="text-3xs text-[var(--text-muted)]">
                              {it.fabric_quality ||
                                invoice.inwardChallan?.fabric_quality ||
                                'Embroidery Fabric'}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono text-[var(--text-muted)] tabular-nums align-top">
                            <span className="font-medium text-[var(--text-main)]">
                              {it.meters != null
                                ? `${Number(it.meters).toFixed(1)} m`
                                : '-'}
                            </span>
                            {it.thans ? (
                              <span className="text-3xs block">
                                {it.thans} Thans
                              </span>
                            ) : null}
                          </td>
                          <td className="p-3 text-right font-mono text-[var(--text-muted)] tabular-nums align-top">
                            <div>{itStitches.toLocaleString('en-IN')} st.</div>
                            <div className="text-3xs">{itHeads} Heads</div>
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums text-[var(--text-main)] align-top">
                            ₹{itRate.toFixed(4)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums align-top">
                            {formatINR(itAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* GST Calculation Breakdown */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Taxable Gross Base:</span>
            <span className="font-mono font-semibold text-[var(--text-main)]">{formatINR(invoice.gross_amount || 0)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>CGST (2.5%):</span>
            <span className="font-mono font-semibold text-[var(--text-main)]">{formatINR(invoice.cgst_amount || 0)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>SGST (2.5%):</span>
            <span className="font-mono font-semibold text-[var(--text-main)]">{formatINR(invoice.sgst_amount || 0)}</span>
          </div>
          {invoice.igst_amount > 0 && (
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>IGST (5%):</span>
              <span className="font-mono font-semibold text-[var(--text-main)]">{formatINR(invoice.igst_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-[var(--text-main)] pt-2 border-t border-[var(--border)]">
            <span>Net Invoiced Payable:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatINR(invoice.net_amount || 0)}</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
