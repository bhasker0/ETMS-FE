'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { InwardChallansApi, InwardChallanApiItem, CreateInwardChallanDto, InwardChallanDesignItem } from '@/lib/api/challans';
import { PartiesApi, PartyApiItem } from '@/lib/api/parties';
import { WhatsappApi } from '@/lib/api/whatsapp';
import { PartyPicker } from '@/components/molecules/PartyPicker';
import { formatINR } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  Truck,
  Plus,
  Download,
  Share2,
  Edit2,
  FileText,
  ArrowRight,
  Check,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 7. Challan Drawer Form (Add / Edit Inward Lot)                             */
/* -------------------------------------------------------------------------- */
export const ChallanDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const isEditing = instance.type === 'EDIT_CHALLAN';
  const editingChallan = instance.payload?.challan as InwardChallanApiItem | undefined;

  const [parties, setParties] = useState<PartyApiItem[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [traderName, setTraderName] = useState(editingChallan?.trader_name || '');
  const [traderGstin, setTraderGstin] = useState(editingChallan?.trader_gstin || '');
  const [challanDate, setChallanDate] = useState(editingChallan?.challan_date || new Date().toISOString().split('T')[0]);
  const [lotNo, setLotNo] = useState(editingChallan?.lot_no || `LOT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [thanCount, setThanCount] = useState<number>(editingChallan?.than_count || 10);
  const [inwardMeters, setInwardMeters] = useState<number>(Number(editingChallan?.inward_meters) || 1000);
  const [fabricQuality, setFabricQuality] = useState(editingChallan?.fabric_quality || 'Georgette 60g');
  const [designNo, setDesignNo] = useState(editingChallan?.design_no || 'DSG-108');
  const [stitchCount, setStitchCount] = useState<number>(editingChallan?.stitch_count || 24000);
  const [karigarCommissionRate, setKarigarCommissionRate] = useState<number>(editingChallan?.karigar_commission_rate || 0.25);
  const [karigarCommissionType, setKarigarCommissionType] = useState<'PER_1K_STITCHES' | 'PER_PIECE' | 'PER_METER'>(editingChallan?.karigar_commission_type || 'PER_1K_STITCHES');
  const [jobworkPricePer1k, setJobworkPricePer1k] = useState<number>(editingChallan?.jobwork_price_per_1k || 0.60);
  const [isMultiDesign, setIsMultiDesign] = useState(Boolean(editingChallan?.items && editingChallan.items.length > 0));
  const [designItems, setDesignItems] = useState<InwardChallanDesignItem[]>(
    editingChallan?.items && editingChallan.items.length > 0
      ? editingChallan.items
      : [
          {
            design_no: 'DSG-108-A',
            stitch_count: 24000,
            commission_type: 'PER_1K_STITCHES',
            commission_rate: 0.25,
            jobwork_price_per_1k: 0.60,
            meters: 500,
            than_count: 5,
          },
          {
            design_no: 'DSG-108-B',
            stitch_count: 32000,
            commission_type: 'PER_1K_STITCHES',
            commission_rate: 0.30,
            jobwork_price_per_1k: 0.75,
            meters: 500,
            than_count: 5,
          },
        ]
  );
  const [notes, setNotes] = useState(editingChallan?.notes || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    PartiesApi.getAll()
      .then((data) => {
        setParties(data);
        if (isEditing && editingChallan) {
          const matched = data.find((p) => p.name.toLowerCase() === editingChallan.trader_name.toLowerCase());
          if (matched) setSelectedPartyId(matched.id);
        } else if (data.length > 0) {
          setSelectedPartyId(data[0].id);
          setTraderName(data[0].name);
          if (data[0].gstin) setTraderGstin(data[0].gstin);
        } else {
          setTraderName('Ambaji Fashion Surat');
          setTraderGstin('24BBCDE5678G1Z3');
        }
      })
      .catch(() => {
        if (!isEditing) {
          setTraderName('Ambaji Fashion Surat');
          setTraderGstin('24BBCDE5678G1Z3');
        }
      });
  }, [isEditing, editingChallan]);

  const addDesignItem = () => {
    setDesignItems((prev) => [
      ...prev,
      {
        design_no: `DSG-${prev.length + 101}`,
        stitch_count: 24000,
        commission_type: 'PER_1K_STITCHES',
        commission_rate: 0.25,
        jobwork_price_per_1k: 0.60,
        meters: 200,
        than_count: 2,
      },
    ]);
  };

  const removeDesignItem = (idx: number) => {
    setDesignItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateDesignItem = (idx: number, field: keyof InwardChallanDesignItem, val: any) => {
    setDesignItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderName.trim() || !lotNo.trim()) {
      toast.error('Trader Name and Lot Number are required');
      return;
    }
    setSubmitting(true);
    try {
      const calculatedMeters = isMultiDesign ? designItems.reduce((acc, item) => acc + Number(item.meters || 0), 0) : Number(inwardMeters);
      const calculatedThans = isMultiDesign ? designItems.reduce((acc, item) => acc + Number(item.than_count || 0), 0) : Number(thanCount);

      const payload: CreateInwardChallanDto = {
        challan_date: challanDate,
        trader_name: traderName,
        trader_gstin: traderGstin,
        lot_no: lotNo,
        than_count: calculatedThans,
        inward_meters: calculatedMeters,
        fabric_quality: fabricQuality,
        design_no: isMultiDesign && designItems.length > 0 ? designItems[0].design_no : designNo,
        stitch_count: Number(stitchCount),
        karigar_commission_rate: Number(karigarCommissionRate),
        karigar_commission_type: karigarCommissionType,
        jobwork_price_per_1k: Number(jobworkPricePer1k),
        items: isMultiDesign ? designItems : undefined,
        notes,
      };

      let result;
      if (isEditing && editingChallan) {
        result = await InwardChallansApi.update(editingChallan.id, payload);
        toast.success(`Inward Lot ${lotNo} updated successfully`);
      } else {
        result = await InwardChallansApi.create(payload);
        toast.success(`Inward Lot ${lotNo} registered with design specs successfully`);
      }
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} challan: ` + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={isEditing ? (t.challan_editTitle || 'Edit Inward Challan & Designs') : t.challan_drawerTitle}
      subtitle={isEditing ? (t.challan_editSubtitle || 'Update gray cloth inward specs, thans, meters, and piece rates') : t.challan_drawerSubtitle}
      icon={<Truck className="w-5 h-5 text-slate-700" />}
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
              const form = document.getElementById(`challan-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? t.saving : isEditing ? 'Update Challan' : t.challan_saveBtn}
          </button>
        </div>
      }
    >
      <form id={`challan-form-${instance.id}`} onSubmit={handleCreateChallan} className="space-y-4">
        <PartyPicker
          selectedPartyId={selectedPartyId}
          partyName={traderName}
          partyGstin={traderGstin}
          onSelect={(p) => {
            setSelectedPartyId(p.id || '');
            setTraderName(p.name);
            if (p.gstin) setTraderGstin(p.gstin);
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelInwardDate}</label>
            <input
              type="date"
              required
              value={challanDate}
              onChange={(e) => setChallanDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelGstin}</label>
            <input
              type="text"
              placeholder="24BBCDE5678G1Z3"
              value={traderGstin}
              onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelLotNo}</label>
            <input
              type="text"
              required
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelQuality}</label>
            <input
              type="text"
              required
              placeholder="e.g. Georgette 60g / Heavy Foil"
              value={fabricQuality}
              onChange={(e) => setFabricQuality(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelMultiDesignToggle}</label>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id={`multi-design-${instance.id}`}
                checked={isMultiDesign}
                onChange={(e) => setIsMultiDesign(e.target.checked)}
                className="w-4 h-4 text-[var(--primary)] rounded border-slate-300"
              />
              <label htmlFor={`multi-design-${instance.id}`} className="text-xs font-medium text-slate-800 cursor-pointer">
                {t.challan_labelMultiDesignToggle}
              </label>
            </div>
          </div>
        </div>

        {!isMultiDesign ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-700 block">
              {t.challan_designSpecsTitle}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelDesignNo}</label>
                <input
                  type="text"
                  required
                  placeholder="DSG-108"
                  value={designNo}
                  onChange={(e) => setDesignNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelStitches}</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={stitchCount}
                  onChange={(e) => setStitchCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelJobworkPrice}</label>
                <input
                  type="number"
                  step="0.01"
                  value={jobworkPricePer1k}
                  onChange={(e) => setJobworkPricePer1k(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelKarigarCommission}</label>
                <input
                  type="number"
                  step="0.01"
                  value={karigarCommissionRate}
                  onChange={(e) => setKarigarCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelCommissionBasis}</label>
                <select
                  value={karigarCommissionType}
                  onChange={(e) => setKarigarCommissionType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="PER_1K_STITCHES">{t.challan_commPer1k}</option>
                  <option value="PER_PIECE">{t.challan_commPerPiece}</option>
                  <option value="PER_METER">{t.challan_commPerMeter}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelThanCount}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={thanCount}
                  onChange={(e) => setThanCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelInwardMeters}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={inwardMeters}
                  onChange={(e) => setInwardMeters(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 font-bold"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[var(--bg-surface-elevated)]/50 border border-[var(--border)] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                {t.challan_multiDesignBreakdown}
              </span>
              <button
                type="button"
                onClick={addDesignItem}
                className="text-xs font-semibold text-[var(--primary)] hover:text-[#9494ff] flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-[var(--border)] shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.challan_addDesignRow}</span>
              </button>
            </div>

            <div className="space-y-3">
              {designItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-white border border-[var(--border)] rounded-lg space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold text-slate-700">{t.challan_designNumber}{idx + 1}</span>
                    {designItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDesignItem(idx)}
                        className="text-rose-500 hover:text-rose-700 text-2xs font-semibold"
                      >
                        {t.challan_remove}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelDesignNo}</label>
                      <input
                        type="text"
                        value={item.design_no}
                        onChange={(e) => updateDesignItem(idx, 'design_no', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelStitches}</label>
                      <input
                        type="number"
                        value={item.stitch_count}
                        onChange={(e) => updateDesignItem(idx, 'stitch_count', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_thThans}</label>
                      <input
                        type="number"
                        value={item.than_count}
                        onChange={(e) => updateDesignItem(idx, 'than_count', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_thMeters}</label>
                      <input
                        type="number"
                        value={item.meters}
                        onChange={(e) => updateDesignItem(idx, 'meters', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelKarigarCommission}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.commission_rate}
                        onChange={(e) => updateDesignItem(idx, 'commission_rate', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-emerald-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelCommissionBasis}</label>
                      <select
                        value={item.commission_type}
                        onChange={(e) => updateDesignItem(idx, 'commission_type', e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                      >
                        <option value="PER_1K_STITCHES">{t.challan_commPer1k}</option>
                        <option value="PER_PIECE">{t.challan_commPerPiece}</option>
                        <option value="PER_METER">{t.challan_commPerMeter}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelJobworkPrice}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.jobwork_price_per_1k}
                        onChange={(e) => updateDesignItem(idx, 'jobwork_price_per_1k', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[var(--border)] text-xs font-mono">
              <span className="text-slate-600 font-sans font-medium">{t.challan_lotTotals}</span>
              <span className="font-bold text-slate-900">
                {designItems.reduce((acc, i) => acc + Number(i.than_count || 0), 0)} Than • {designItems.reduce((acc, i) => acc + Number(i.meters || 0), 0)} Meters
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.challan_notes}</label>
          <textarea
            rows={2}
            placeholder="e.g. Delivered via Sachin GIDC tempo transport"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
          />
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 7b. View Challan Drawer Form (Inspect Lot & Designs)                       */
/* -------------------------------------------------------------------------- */
export const ViewChallanDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer, openDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [challan, setChallan] = useState<InwardChallanApiItem | null>(
    (instance.payload?.challan as InwardChallanApiItem) || null
  );
  const [loading, setLoading] = useState(!instance.payload?.challan && Boolean(instance.payload?.challanId));
  const [sendingWa, setSendingWa] = useState(false);

  useEffect(() => {
    if (!challan && instance.payload?.challanId) {
      setLoading(true);
      InwardChallansApi.getById(instance.payload.challanId)
        .then((data) => setChallan(data))
        .catch((e) => console.warn('Failed to load challan:', e))
        .finally(() => setLoading(false));
    }
  }, [instance.payload?.challanId]);

  if (loading) {
    return (
      <Drawer
        isOpen={true}
        onClose={closeDrawer}
        level={level}
        title={t.challan_viewTitle || 'View Inward Challan & Lot Specs'}
        subtitle="Loading inward lot details..."
        icon={<Truck className="w-5 h-5 text-slate-700" />}
        size="lg"
      >
        <div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading lot details...</div>
      </Drawer>
    );
  }

  if (!challan) return null;

  const linkedInvoice = (challan as any).outwardInvoices?.[0] || challan.outward_invoices?.[0];
  const isInvoiced = Boolean(linkedInvoice || challan.status === 'DISPATCHED');

  const handleDownloadPdf = async () => {
    try {
      await InwardChallansApi.downloadPdf(challan.id, challan.challan_no || `challan-${challan.lot_no}`);
      toast.success(`Downloaded Delivery Challan ${challan.challan_no || challan.lot_no} PDF`);
    } catch (err: any) {
      toast.error('Failed to download challan PDF: ' + err.message);
    }
  };

  const handleSendWhatsApp = async () => {
    setSendingWa(true);
    try {
      const res = await WhatsappApi.sendChallanPdf(challan.id);
      const displayPhone = res?.recipient?.phone || 'registered mobile';
      if (res?.isFallback) {
        toast.warning(res?.message || 'WhatsApp Gateway offline; opened web fallback.');
        if (res?.fallbackUrl) {
          window.open(res.fallbackUrl, '_blank');
        }
      } else {
        toast.success(`Challan ${challan.challan_no} PDF sent to ${challan.trader_name} (${displayPhone}) via WhatsApp!`);
      }
    } catch (err: any) {
      toast.error('Failed to send WhatsApp document: ' + err.message);
    } finally {
      setSendingWa(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={`Lot #${challan.lot_no}`}
      subtitle={`${challan.trader_name} • ${challan.challan_date || 'Inward Lot'}`}
      icon={<Truck className="w-5 h-5 text-slate-700" />}
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-1/5 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            title="Download Inward Delivery Challan PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={sendingWa}
            className="w-1/5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            title="Send Challan PDF directly to trader on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{sendingWa ? 'Sending...' : 'WhatsApp'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              closeDrawer();
              openDrawer('EDIT_CHALLAN', { challan });
            }}
            className="w-1/5 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          {isInvoiced ? (
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                openDrawer('VIEW_INVOICE', { invoice: linkedInvoice, challan, challanId: challan.id });
              }}
              className="w-1/5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoice</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                openDrawer('CREATE_INVOICE', { challan, challanId: challan.id, lotNo: challan.lot_no });
              }}
              className="w-1/5 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Bill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Lot Spec Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-3xs text-[var(--text-muted)] font-semibold uppercase">Lot Number</div>
            <div className="text-sm font-mono font-bold text-[var(--text-main)] mt-0.5">{challan.lot_no}</div>
          </div>
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-3xs text-[var(--text-muted)] font-semibold uppercase">Thans Count</div>
            <div className="text-sm font-mono font-bold text-[var(--text-main)] mt-0.5">{challan.than_count} Thans</div>
          </div>
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-3xs text-[var(--text-muted)] font-semibold uppercase">Inward Length</div>
            <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{challan.inward_meters} m</div>
          </div>
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-3xs text-[var(--text-muted)] font-semibold uppercase">Current Status</div>
            <div className="text-xs font-semibold uppercase mt-1 text-[var(--text-main)]">{challan.status}</div>
          </div>
        </div>

        {/* Trader Info Card */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-2">
          <div className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Trader & Supply Details</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Trader / Party</span>
              <span className="font-semibold text-[var(--text-main)]">{challan.trader_name}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">GSTIN</span>
              <span className="font-mono text-[var(--text-main)]">{challan.trader_gstin || 'Unregistered'}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Fabric Quality</span>
              <span className="font-medium text-[var(--text-main)]">{challan.fabric_quality}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-3xs">Challan Date</span>
              <span className="font-mono text-[var(--text-main)]">{challan.challan_date || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Multi-Designs Table */}
        {challan.items && challan.items.length > 0 ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Assigned Designs ({challan.items.length})
            </div>
            <div className="divide-y divide-[var(--border)] text-xs">
              {challan.items.map((it, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-[var(--text-main)]">{it.design_no}</div>
                    <div className="text-3xs text-[var(--text-muted)]">
                      {it.stitch_count?.toLocaleString()} stitches • {it.than_count || 1} thans
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-emerald-600">{it.meters} m</div>
                    <div className="text-3xs text-[var(--text-muted)]">
                      ₹{it.jobwork_price_per_1k}/1k • Comm: ₹{it.commission_rate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
            <div className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Standard Jobwork Specs</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[var(--text-muted)] block text-3xs">Design Code</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{challan.design_no || 'Standard'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-3xs">Stitch Count</span>
                <span className="font-mono text-[var(--text-main)]">{Number(challan.stitch_count || 24000).toLocaleString()} st.</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-3xs">Rate / 1k</span>
                <span className="font-mono text-[var(--text-main)]">₹{challan.jobwork_price_per_1k || 0.60}</span>
              </div>
            </div>
          </div>
        )}

        {/* Linked Invoices */}
        {challan.outward_invoices && challan.outward_invoices.length > 0 && (
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 uppercase text-3xs tracking-wider flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Invoiced Status</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">
                {challan.outward_invoices[0].invoice_no}
              </span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400">
                {formatINR(challan.outward_invoices[0].net_amount || 0)}
              </span>
            </div>
          </div>
        )}

        {challan.notes && (
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold block text-3xs uppercase">Notes / Instructions</span>
            {challan.notes}
          </div>
        )}
      </div>
    </Drawer>
  );
};
